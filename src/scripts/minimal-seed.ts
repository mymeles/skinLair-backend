import { ExecArgs } from "@medusajs/framework/types"
import { createApiKeysWorkflow } from "@medusajs/medusa/core-flows"

export default async function minimalSeed({ container }: ExecArgs) {
  console.log("Starting minimal seed...")

  try {
    // Create a publishable API key
    console.log("Creating publishable API key...")
    const { result: apiKeyResult } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Store API Key",
            type: "publishable",
            created_by: "admin",
          },
        ],
      },
    })

    console.log("Publishable API key created:", apiKeyResult[0].id)
    console.log("API Key:", apiKeyResult[0].token)

    console.log("Minimal seed completed successfully!")
  } catch (error) {
    console.error("Error in minimal seed:", error)
    throw error
  }
}
