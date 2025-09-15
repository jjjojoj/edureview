import { db } from "~/server/db";

async function setup() {
  console.log("Starting application setup...");

  // Note: OSS buckets are managed through Alibaba Cloud console or lifecycle setup script
  console.log("OSS bucket 'homework-imgs' should be created through Alibaba Cloud console");

  // Seed knowledge areas if they don't exist
  const knowledgeAreas = [
    { name: "Algebra", description: "Linear equations, quadratic equations, polynomials" },
    { name: "Geometry", description: "Shapes, angles, area, volume calculations" },
    { name: "Statistics", description: "Data analysis, probability, distributions" },
    { name: "Calculus", description: "Derivatives, integrals, limits" },
    { name: "Trigonometry", description: "Sine, cosine, tangent functions" },
    { name: "Number Theory", description: "Prime numbers, divisibility, modular arithmetic" },
    { name: "Logic", description: "Boolean logic, proof techniques, reasoning" },
    { name: "Functions", description: "Function notation, domain, range, transformations" },
  ];

  for (const area of knowledgeAreas) {
    const existing = await db.knowledgeArea.findUnique({
      where: { name: area.name },
    });
    
    if (!existing) {
      await db.knowledgeArea.create({
        data: area,
      });
      console.log(`Created knowledge area: ${area.name}`);
    }
  }

  console.log("Application setup complete!");
}

setup()
  .then(() => {
    console.log("setup.ts complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });
