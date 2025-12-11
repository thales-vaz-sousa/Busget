
import React, { useState, useMemo } from 'react';
import { Transaction, Category, MealPlanRecipe } from '../types';
import { generateMonthlyMealPlan } from '../services/geminiService';
import { UtensilsIcon } from './Icons';
import { useToast } from '../context/ToastContext';

interface RecipePlannerProps {
  transactions: Transaction[];
}

const RecipePlanner: React.FC<RecipePlannerProps> = ({ transactions }) => {
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<MealPlanRecipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<MealPlanRecipe | null>(null);
  const { showToast } = useToast();

  // 1. Data Aggregation: Consolidate ingredients with frequency
  const inventoryList = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const relevantTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return (
        tDate >= thirtyDaysAgo &&
        (t.category === Category.FOOD || t.category === Category.SHOPPING) &&
        t.type === 'expense'
      );
    });

    const inventoryMap = new Map<string, number>();
    relevantTransactions.forEach(t => {
      // Normalize description
      const desc = t.description.toLowerCase().trim();
      inventoryMap.set(desc, (inventoryMap.get(desc) || 0) + 1);
    });

    const consolidated = Array.from(inventoryMap.entries())
      .map(([item, count]) => count > 1 ? `${item} (${count})` : item)
      .join(', ');

    return consolidated || "";
  }, [transactions]);

  const handleGenerate = async () => {
    if (!inventoryList) {
      const msg = "No food expenses found in the last 30 days to analyze.";
      setError(msg);
      showToast('error', msg);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await generateMonthlyMealPlan(inventoryList);
      setRecipes(result);
      showToast('success', 'Meal plan generated successfully! Bon appétit!');
    } catch (err) {
      const msg = "Failed to generate meal plan. Please try again.";
      setError(msg);
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm p-8 border-l-4 border-butterfly-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-butterfly-100 rounded-full text-butterfly-600">
            <UtensilsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Monthly Meal Guide</h2>
            <p className="text-gray-500">AI-curated recipes based on your actual monthly spending.</p>
          </div>
        </div>

        <div className="bg-butterfly-50 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold text-butterfly-800 uppercase tracking-wide mb-2">
            Analyzed Inventory (Last 30 Days)
          </h3>
          <p className="text-gray-700 text-sm italic">
            {inventoryList || "No data available."}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleGenerate}
            disabled={loading || !inventoryList}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-butterfly-500 to-butterfly-600 text-white font-medium hover:from-butterfly-600 hover:to-butterfly-700 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating Your Plan...
              </>
            ) : (
              "Generate Monthly Plan"
            )}
          </button>
        </div>
        {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
      </div>

      {/* Recipe Grid */}
      {recipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedRecipe(recipe)}
              className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col hover:shadow-xl hover:-translate-y-1 transition cursor-pointer group"
            >
              {/* Image Placeholder in Card */}
              <div className="h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-butterfly-100 opacity-20 group-hover:opacity-30 transition"></div>
                 <span className="text-4xl">🍽️</span>
              </div>

              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-nature-600 uppercase tracking-wider bg-nature-50 px-2 py-1 rounded-md">
                    {recipe.cuisine_type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {recipe.prep_time}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-butterfly-600 transition">{recipe.recipe_name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  Uses: {recipe.ingredients_used.join(', ')}
                </p>
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center text-xs font-medium text-butterfly-500 uppercase tracking-wide">
                Click for Recipe
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">
            
            {/* Modal Image Section */}
            <div className="md:w-1/3 bg-gray-100 relative min-h-[200px] md:min-h-full">
              {/* Dynamic Image Placeholder using Placehold.co for reliability */}
              <img 
                src={`https://placehold.co/600x800/fae8ff/a21caf?text=${encodeURIComponent(selectedRecipe.recipe_name)}`}
                alt={selectedRecipe.recipe_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
                <p className="text-xs opacity-80">Search Query:</p>
                <p className="text-sm font-medium italic">"{selectedRecipe.image_search_query}"</p>
              </div>
            </div>

            {/* Modal Content Section */}
            <div className="md:w-2/3 p-8">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <span className="text-xs font-bold text-butterfly-500 uppercase tracking-wider">
                      {selectedRecipe.cuisine_type}
                    </span>
                    <h2 className="text-3xl font-bold text-gray-800 mt-1">{selectedRecipe.recipe_name}</h2>
                 </div>
                 <button 
                   onClick={() => setSelectedRecipe(null)}
                   className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
              </div>

              <div className="flex gap-4 mb-6 text-sm text-gray-600">
                 <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-lg">
                    <span>⏱️ Prep: {selectedRecipe.prep_time}</span>
                 </div>
                 <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-lg">
                    <span>🍳 Cook: {selectedRecipe.cook_time}</span>
                 </div>
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-2">Ingredients Used</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRecipe.ingredients_used.map((ing, i) => (
                    <span key={i} className="px-2 py-1 bg-nature-50 text-nature-700 border border-nature-100 rounded-md text-xs font-medium">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-3">Cooking Instructions</h4>
                <ol className="space-y-4">
                  {selectedRecipe.cooking_steps.map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-butterfly-100 text-butterfly-600 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-gray-600 text-sm leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RecipePlanner;
