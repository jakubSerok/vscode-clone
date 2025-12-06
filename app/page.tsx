import Image from "next/image";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export default function Home() {
  return (
    <div>
      <Button>Get Started</Button>
    </div>
  );
}
