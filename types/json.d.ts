declare module "*.json" {
  const content: {
    playerSpecific: Array<{
      text: string;
      type: "single-player" | "call-response" | "conditional";
      category: "drinking" | "action" | "social";
    }>;
  };
  export default content;
}
