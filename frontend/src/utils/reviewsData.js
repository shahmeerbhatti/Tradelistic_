import { getReviewers } from '../services/api';

// Cache for reviewer data
let reviewersCache = null;

// Load reviewers from database
const loadReviewers = async () => {
  if (reviewersCache) {
    return reviewersCache;
  }
  
  try {
    const response = await getReviewers();
    reviewersCache = response.data;
    return reviewersCache;
  } catch (error) {
    console.warn('Failed to load reviewers from database, using fallback data:', error);
    // Fallback to static data if API fails
    return getFallbackReviewers();
  }
};

// Fallback reviewer data if database is unavailable
const getFallbackReviewers = () => {
  return [
    { id: 1, username: "sarah_johnson", first_name: "Sarah", last_name: "Johnson", city: "New York", state_country: "NY, USA" },
    { id: 2, username: "mike_chen", first_name: "Mike", last_name: "Chen", city: "Los Angeles", state_country: "CA, USA" },
    { id: 3, username: "emma_rodriguez", first_name: "Emma", last_name: "Rodriguez", city: "Miami", state_country: "FL, USA" },
    { id: 4, username: "david_brown", first_name: "David", last_name: "Brown", city: "Toronto", state_country: "Ontario, Canada" },
    { id: 5, username: "lisa_garcia", first_name: "Lisa", last_name: "Garcia", city: "Chicago", state_country: "IL, USA" },
    { id: 6, username: "james_wilson", first_name: "James", last_name: "Wilson", city: "London", state_country: "England, UK" },
    { id: 7, username: "anna_kumar", first_name: "Anna", last_name: "Kumar", city: "Mumbai", state_country: "Maharashtra, India" },
    { id: 8, username: "carlos_silva", first_name: "Carlos", last_name: "Silva", city: "São Paulo", state_country: "SP, Brazil" },
    { id: 9, username: "maria_lopez", first_name: "Maria", last_name: "Lopez", city: "Madrid", state_country: "Spain" },
    { id: 10, username: "robert_taylor", first_name: "Robert", last_name: "Taylor", city: "Sydney", state_country: "NSW, Australia" }
  ];
};

// Review text templates
const reviewTemplates = [
  { rating: 5, text: "Excellent detail in pattern. Excellent stitchout.", verified: true },
  { rating: 5, text: "Great design sewed out perfectly.", verified: true },
  { rating: 5, text: "Great file, Came out perfectly.", verified: false },
  { rating: 5, text: "Loved the way this stitched out", verified: true },
  { rating: 5, text: "The font set matched the description and stitches well.", verified: true },
  { rating: 5, text: "Great purchase! Highly recommend, easy to use.", verified: true },
  { rating: 4, text: "Good quality product, exactly as described.", verified: true },
  { rating: 5, text: "Perfect! Easy to use and great results.", verified: true },
  { rating: 4, text: "Very satisfied with this purchase. Will buy again.", verified: false },
  { rating: 5, text: "Amazing quality and fast delivery. Highly recommended!", verified: true },
  { rating: 4, text: "Good product overall, meets expectations.", verified: true },
  { rating: 5, text: "Excellent craftsmanship and attention to detail.", verified: true },
  { rating: 5, text: "Outstanding product, exceeded my expectations!", verified: false },
  { rating: 4, text: "Great value for money, would recommend to others.", verified: true },
  { rating: 5, text: "Perfect fit and finish. Very impressed!", verified: true }
];

// Generate reviews for a specific product
export const generateReviews = async (productId) => {
  const reviewers = await loadReviewers();
  const numReviews = Math.floor(Math.random() * 11) + 40; // 40-50 reviews
  const reviews = [];

  // Shuffle reviewers to get random selection
  const shuffledReviewers = [...reviewers].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < numReviews; i++) {
    const reviewer = shuffledReviewers[i % shuffledReviewers.length];
    const template = reviewTemplates[i % reviewTemplates.length];
    
    // Generate random date within last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const randomDate = new Date(sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime()));
    
    reviews.push({
      id: `${productId}-review-${i + 1}`,
      user: {
        id: reviewer.id,
        name: `${reviewer.first_name} ${reviewer.last_name}`,
        location: `${reviewer.city}, ${reviewer.state_country}`
      },
      rating: template.rating,
      comment: template.text,
      date: randomDate.toISOString(),
      verifiedPurchase: template.verified,
      helpful: Math.floor(Math.random() * 15) // 0-14 helpful votes
    });
  }

  // Sort by date (newest first)
  reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return reviews;
};

// Get paginated reviews
export const getProductReviews = async (productId, page = 1, limit = 5) => {
  const allReviews = await generateReviews(productId);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    reviews: allReviews.slice(startIndex, endIndex),
    totalReviews: allReviews.length,
    totalPages: Math.ceil(allReviews.length / limit),
    currentPage: page,
    averageRating: (allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length).toFixed(1)
  };
};