export interface Strategy {
  id: string;
  name: string;
  status: "active" | "review" | "avoid";
}
