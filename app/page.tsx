import Hero from "@/components/Hero";
import Section from "@/components/Section";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#081426] text-white">
      <Section>
        <Hero />
      </Section>
    </div>
  );
}
