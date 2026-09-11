import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import http, { type IncomingMessage, type RequestOptions } from "node:http";
import https from "node:https";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { WebsiteFetcher } from "../src/core/discovery/WebsiteFetcher";
import { isPublicAddress, parsePublicWebsiteUrl, resolvePublicAddress } from "../src/core/discovery/PublicWebsitePolicy";
import { runDiscovery } from "../app/discovery/actions";
import { acquireScanCapacity } from "../src/core/discovery/ScanCapacity";

afterEach(() => mock.restoreAll());
const publicDns = async () => [{address:"93.184.216.34", family:4}];
type Fixture = {status?: number; headers?: Record<string,string>; chunks?: string[]; stall?: boolean};
function fakeNetwork(fixtures: Fixture[]) {
  const calls: Array<{url:URL; options:RequestOptions}> = [];
  const request = (url: URL, options: RequestOptions, callback: (res:IncomingMessage)=>void) => {
    calls.push({url,options});
    const fixture = fixtures.shift();
    assert.ok(fixture, "Unexpected outbound request");
    const response = Object.assign(new PassThrough(), {statusCode:fixture.status ?? 200, headers:{"content-type":"text/html",...fixture.headers}});
    const req = new EventEmitter() as EventEmitter & {end:()=>void};
    const abort = () => { response.destroy(new Error("aborted")); req.emit("error",new Error("aborted")); };
    req.end = () => queueMicrotask(() => {
      options.signal?.addEventListener("abort",abort,{once:true});
      response.once("close",()=>options.signal?.removeEventListener("abort",abort));
      callback(response as unknown as IncomingMessage);
      for(const chunk of fixture.chunks ?? ["<h1>Northstar</h1>"]) response.write(chunk);
      if(!fixture.stall) response.end();
    });
    return req as unknown as http.ClientRequest;
  };
  mock.method(http,"request",request as typeof http.request);
  mock.method(https,"request",request as typeof https.request);
  return calls;
}

test("rejects internal, special, alternate-notation and mapped IP destinations", () => {
  for(const address of ["127.0.0.1","10.1.2.3","100.64.1.1","169.254.169.254","172.16.1.1","192.168.1.1","192.0.0.8","198.19.1.1","203.0.113.1","224.0.0.1","255.255.255.255","::1","::ffff:8.8.8.8","fe80::1","fc00::1","2002:0808:0808::1","2001:db8::1","3fff::1","64:ff9b::a00:1"]) assert.equal(isPublicAddress(address),false,address);
  for(const url of ["http://127.1","http://2130706433","http://0x7f000001","http://0177.0.0.1","http://[::ffff:127.0.0.1]","http://localhost.","http://metadata.google.internal","http://foo.local","http://192.168.1.1"]) assert.throws(()=>parsePublicWebsiteUrl(url),url);
  assert.ok(isPublicAddress("8.8.8.8"));
  assert.ok(isPublicAddress("2606:4700:4700::1111"));
});

test("URL boundary rejects malformed input, credentials, custom ports and unsupported protocols", async () => {
  for(const input of [null,{},12,"", "x".repeat(2049),"file:///etc/passwd","ftp://example.com","https://user:password@example.com","https://example.com:8080"]) {
    assert.throws(()=>parsePublicWebsiteUrl(input));
    assert.ok("error" in await runDiscovery(input));
  }
  assert.equal(parsePublicWebsiteUrl("https://example.com:443/a#fragment").href,"https://example.com/a");
});

test("rejects empty and mixed public/private DNS answers before opening a connection", async () => {
  for(const addresses of [[],[{address:"8.8.8.8",family:4},{address:"10.0.0.1",family:4}],[{address:"8.8.8.8",family:6}]]) {
    await assert.rejects(resolvePublicAddress("example.com",new AbortController().signal,async()=>addresses),/publicly accessible/);
  }
});

test("pins the approved IP while preserving hostname and certificate verification", async () => {
  const calls=fakeNetwork([{}]);
  let resolutions=0;
  const fetcher=new WebsiteFetcher({},async()=>{resolutions++;return publicDns();});
  const result=await fetcher.fetchPage("https://example.com/page");
  assert.equal(result.html,"<h1>Northstar</h1>");
  assert.equal(result.finalUrl,"https://example.com/page");
  assert.equal(calls[0].url.hostname,"example.com");
  assert.equal(calls[0].options.agent,false);
  assert.equal((calls[0].options as RequestOptions & {autoSelectFamily: boolean}).autoSelectFamily,false);
  assert.equal((calls[0].options as https.RequestOptions).rejectUnauthorized,undefined);
  const lookup=calls[0].options.lookup!;
  lookup("example.com",{},(error,address,family)=>{assert.equal(error,null);assert.equal(address,"93.184.216.34");assert.equal(family,4);});
  assert.equal(resolutions,1);
});

test("validates every redirect and reports the final source URL", async () => {
  const calls=fakeNetwork([{status:302,headers:{location:"/about"}},{}]);
  const result=await new WebsiteFetcher({},publicDns).fetchPage("https://example.com/");
  assert.equal(result.finalUrl,"https://example.com/about");
  assert.equal(calls.length,2);
});

test("blocks private redirects, DNS rebinding, credential redirects and HTTPS downgrade", async () => {
  for(const target of ["http://169.254.169.254/","https://user:pass@example.com/","http://example.com/"]) {
    const calls=fakeNetwork([{status:302,headers:{location:target}}]);
    await assert.rejects(new WebsiteFetcher({},publicDns).fetchHtml("https://example.com/"));
    assert.equal(calls.length,1);
    mock.restoreAll();
  }
  const calls=fakeNetwork([{status:302,headers:{location:"/next"}}]);
  let count=0;
  await assert.rejects(new WebsiteFetcher({},async()=>++count===1?publicDns():[{address:"127.0.0.1",family:4}]).fetchHtml("https://example.com/"),/publicly accessible/);
  assert.equal(calls.length,1);
});

test("enforces redirect count and loop limits", async () => {
  fakeNetwork([{status:302,headers:{location:"/"}}]);
  await assert.rejects(new WebsiteFetcher({},publicDns).fetchHtml("https://example.com/"),/loop/);
  mock.restoreAll();
  fakeNetwork([{status:302,headers:{location:"/next"}}]);
  await assert.rejects(new WebsiteFetcher({maxRedirects:0},publicDns).fetchHtml("https://example.com/"),/too many/);
});

test("bounds chunked bodies and rejects large declared sizes, non-HTML, compression and HTTP failures", async () => {
  const fixtures: Fixture[] = [
    {chunks:["12345","67890"]}, {headers:{"content-length":"100"}},
    {headers:{"content-type":"application/json"}}, {headers:{"content-encoding":"gzip"}}, {status:500},
  ];
  for(const fixture of fixtures) {
    fakeNetwork([fixture]);
    await assert.rejects(new WebsiteFetcher({maxBytes:8},publicDns).fetchHtml("https://example.com/"));
    mock.restoreAll();
  }
});

test("one deadline covers stalled DNS and streamed response bodies", async () => {
  await assert.rejects(new WebsiteFetcher({timeoutMs:20},()=>new Promise(()=>{})).fetchHtml("https://example.com/"),/too long/);
  fakeNetwork([{chunks:["x"],stall:true}]);
  await assert.rejects(new WebsiteFetcher({timeoutMs:20},publicDns).fetchHtml("https://example.com/"),/too long/);
});

test("does not disclose network errors or private diagnostic details", async () => {
  await assert.rejects(new WebsiteFetcher({},async()=>{throw new Error("secret internal-service 10.0.0.1");}).fetchHtml("https://example.com/?token=secret"),error=>error instanceof Error && !/secret|internal-service|10\.0\.0\.1/.test(error.message));
});

test("process capacity rejects excess work and releases slots idempotently", () => {
  const a=acquireScanCapacity(),b=acquireScanCapacity();
  assert.throws(()=>acquireScanCapacity(),/capacity/);
  a();a();
  const c=acquireScanCapacity();
  assert.throws(()=>acquireScanCapacity(),/capacity/);
  b();c();
});
