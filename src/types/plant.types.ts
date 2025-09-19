export interface PlantInfo {
  name: string;
  commonNames: string[];
  scientificName: string;
  family: string;
  toxicity: string[];
  toxicPrinciples: string;
  clinicalSigns: string;
  url: string;
  imageUrl?: string;
}

export interface PlantLink {
  name: string;
  url: string;
  commonNames: string[];
  scientificName: string;
  family: string;
  toxicity?: string[];
}
