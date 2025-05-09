
import { FoodReview } from '@/types/food';

// Reviews implementation
export const getFoodReviews = async (foodItemId: string): Promise<FoodReview[]> => {
  // Mock data until we have a food_reviews table
  return [
    {
      id: '1',
      food_item_id: foodItemId,
      user_id: 'user-1',
      rating: 4,
      comment: 'Great taste and quick delivery!',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      food_item_id: foodItemId,
      user_id: 'user-2',
      rating: 5,
      comment: 'Best food I ever had on campus!',
      created_at: new Date().toISOString()
    }
  ];
};

export const createFoodReview = async (
  foodItemId: string,
  userId: string,
  rating: number,
  comment: string
): Promise<{ data: FoodReview | null, error: any }> => {
  // This is a mock implementation until we have a food_reviews table
  const mockReview: FoodReview = {
    id: Math.random().toString(36).substring(2, 9),
    food_item_id: foodItemId,
    user_id: userId,
    rating,
    comment,
    created_at: new Date().toISOString()
  };
  
  return {
    data: mockReview,
    error: null
  };
};
