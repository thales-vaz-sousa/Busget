import { GoogleGenAI, Type } from "@google/genai";
import { OcrResult, MealPlanRecipe } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseReceiptImage = async (base64Image: string, mimeType: string): Promise<OcrResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: `Analyze this receipt image. Extract the total amount, the date, a short description (merchant name), and the most likely category.
            Categories must be one of: Housing, Food, Transport, Utilities, Entertainment, Healthcare, Personal, Shopping, Other.
            If the date is missing, return the current date in YYYY-MM-DD format.
            Return the result in JSON format.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "Total amount on the receipt" },
            date: { type: Type.STRING, description: "Date of transaction in YYYY-MM-DD format" },
            description: { type: Type.STRING, description: "Merchant name or brief description" },
            category: { type: Type.STRING, description: "Expense category" }
          },
          required: ["amount", "description", "category"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text) as OcrResult;

  } catch (error) {
    console.error("Error parsing receipt with Gemini:", error);
    throw error;
  }
};

export const generateMonthlyMealPlan = async (inventory: string): Promise<MealPlanRecipe[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert meal planner.
      Here is an aggregated list of ingredients purchased by the user in the last 30 days, including frequency: 
      "${inventory}".
      
      Based on this inventory, generate a diverse set of 7-10 complete recipes that can serve as a monthly meal guide. 
      Prioritize ingredients that appear frequently.
      Provide detailed cooking steps and a visual search query for each dish.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              recipe_name: { type: Type.STRING, description: "Name of the dish" },
              cuisine_type: { type: Type.STRING, description: "E.g., Italian, Mexican, Asian" },
              ingredients_used: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of ingredients from the inventory used here" 
              },
              prep_time: { type: Type.STRING },
              cook_time: { type: Type.STRING },
              cooking_steps: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Step-by-step cooking instructions"
              },
              image_search_query: { type: Type.STRING, description: "A short, descriptive query to find an image of this dish (e.g. 'spicy tomato pasta overhead view')" }
            },
            required: ["recipe_name", "cuisine_type", "ingredients_used", "prep_time", "cook_time", "cooking_steps", "image_search_query"]
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text) as MealPlanRecipe[];
  } catch (error) {
    console.error("Error generating meal plan:", error);
    throw error;
  }
};