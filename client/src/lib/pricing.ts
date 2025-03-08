// Helper functions for price calculations
export const calculatePriceStats = (acrePrices: any[], currentProperty: any) => {
  if (!acrePrices.length) return null;

  // Calculate price per acre for each property
  const pricesPerAcre = acrePrices
    .filter(p => p.price && p.acre) // Filter out invalid entries
    .map(p => p.price! / p.acre!);

  if (!pricesPerAcre.length) return null;

  // Similarity clustering with a threshold of 25%
  const similarityThreshold = 0.25; // 25% threshold for similarity
  const clusters: number[][] = [];

  // Create a copy of prices for processing
  const remainingPrices = [...pricesPerAcre];
  
  // Build clusters
  while (remainingPrices.length > 0) {
    const currentPrice = remainingPrices.shift()!;
    const currentCluster: number[] = [currentPrice];
    
    // Find all prices within threshold of current price
    for (let i = remainingPrices.length - 1; i >= 0; i--) {
      const price = remainingPrices[i];
      const percentDiff = Math.abs(price - currentPrice) / currentPrice;
      
      if (percentDiff <= similarityThreshold) {
        currentCluster.push(price);
        remainingPrices.splice(i, 1);
      }
    }
    
    clusters.push(currentCluster);
  }
  
  // Calculate current price per acre if market value and GIS area are available
  let currentPricePerAcre: number | null = null;
  let selectedCluster: number[];
  let clusterSelectionReason: string;
  
  if (currentProperty.marketValue && currentProperty.gisArea && currentProperty.gisArea > 0) {
    currentPricePerAcre = currentProperty.marketValue / currentProperty.gisArea;
    
    // Find the cluster with the mean closest to the current price per acre
    let closestCluster = clusters[0];
    let minDifference = Number.MAX_VALUE;
    
    clusters.forEach(cluster => {
      const clusterMean = cluster.reduce((a, b) => a + b, 0) / cluster.length;
      const difference = Math.abs(clusterMean - currentPricePerAcre!);
      
      if (difference < minDifference) {
        minDifference = difference;
        closestCluster = cluster;
      }
    });
    
    selectedCluster = closestCluster;
    clusterSelectionReason = "nearest to property's current value";
  } else {
    // Sort clusters by size (largest first) as fallback
    clusters.sort((a, b) => b.length - a.length);
    selectedCluster = clusters[0];
    clusterSelectionReason = "largest cluster available";
  }
  
  const otherCount = pricesPerAcre.length - selectedCluster.length;
  
  // Calculate statistics using the selected cluster
  const mean = selectedCluster.reduce((a, b) => a + b, 0) / selectedCluster.length;
  const variance = selectedCluster.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / selectedCluster.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean; // Coefficient of variation

  return {
    mean,
    stdDev,
    cv,
    min: Math.min(...selectedCluster),
    max: Math.max(...selectedCluster),
    count: selectedCluster.length,
    totalCount: pricesPerAcre.length,
    outliers: otherCount,
    numClusters: clusters.length,
    clusterSizes: clusters.map(c => c.length).join(', '),
    currentPricePerAcre,
    clusterSelectionReason
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};
