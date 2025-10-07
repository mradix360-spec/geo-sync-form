export const calculateStatistics = (values: number[], statistic: string): number => {
  if (values.length === 0) return 0;

  switch (statistic) {
    case 'count':
      return values.length;
    
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    
    case 'min':
      return Math.min(...values);
    
    case 'max':
      return Math.max(...values);
    
    case 'median': {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    }
    
    case 'stddev': {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const squareDiffs = values.map(value => Math.pow(value - avg, 2));
      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
      return Math.sqrt(avgSquareDiff);
    }
    
    case 'variance': {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const squareDiffs = values.map(value => Math.pow(value - avg, 2));
      return squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    }
    
    default:
      return values.length;
  }
};

export const filterByDateRange = (date: string, range: string): boolean => {
  const itemDate = new Date(date);
  const now = new Date();
  
  switch (range) {
    case 'today':
      return itemDate.toDateString() === now.toDateString();
    
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= weekAgo;
    
    case 'month':
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return itemDate >= monthAgo;
    
    case 'quarter':
      const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return itemDate >= quarterAgo;
    
    case 'year':
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      return itemDate >= yearAgo;
    
    default:
      return true;
  }
};

export const formatStatisticValue = (value: number, statistic: string): string => {
  if (statistic === 'count') {
    return value.toFixed(0);
  }
  
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  
  return value.toFixed(2);
};
