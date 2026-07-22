export type ProjectReadiness = {
  isReady: boolean;
  missingFields: string[];
};

export function getProjectReadiness(project: {
  designName?: string;
  width?: string;
  height?: string;
  material?: string;
  thickness?: string;
}): ProjectReadiness {
  const missingFields = [
    !project.designName?.trim() ? "design name" : null,
    !project.width?.trim() || !project.height?.trim() ? "size" : null,
    !project.material?.trim() ? "material" : null,
    !project.thickness?.trim() ? "thickness" : null,
  ].filter(Boolean) as string[];

  return {
    isReady: missingFields.length === 0,
    missingFields,
  };
}
