import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Star, Heart, ShoppingCart, ArrowLeft, Check, Truck, Shield, Award, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CartSidebar from "@/components/cart-sidebar";
import AuthModal from "@/components/auth-modal";
import SearchOverlay from "@/components/search-overlay";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Product } from "@shared/schema";

interface ProductDetailParams {
  id: string;
}

const ProductDetail = () => {
  const { id } = useParams<ProductDetailParams>();
  const [, setLocation] = useLocation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all products to find similar ones
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["allProducts"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
  });

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) {
        throw new Error("Product not found");
      }
      return response.json();
    },
    enabled: !!id,
  });

  // Set selected size when product loads
  useEffect(() => {
    if (product) {
      setSelectedSize(product);
    }
  }, [product]);

  // Find similar products (same name, different sizes)
  const similarProducts = allProducts.filter(p => 
    product && p.name === product.name && p.id !== product.id
  ).sort((a, b) => {
    // Sort by volume size (ml value)
    const volA = parseInt(a.volume.replace('ml', ''));
    const volB = parseInt(b.volume.replace('ml', ''));
    return volA - volB;
  });

  // All products with the same name (including current product)
  const allSizes = product ? [product, ...similarProducts].sort((a, b) => {
    const volA = parseInt(a.volume.replace('ml', ''));
    const volB = parseInt(b.volume.replace('ml', ''));
    return volA - volB;
  }) : [];

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const sessionId = localStorage.getItem("sessionId") || "guest";
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          productId,
          quantity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "Added to Cart",
        description: `${selectedSize?.name} has been added to your cart.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = () => {
    if (selectedSize) {
      addToCartMutation.mutate({ productId: selectedSize.id, quantity });
    }
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
      description: `${selectedSize?.name} has been ${isWishlisted ? "removed from" : "added to"} your wishlist.`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
          <p className="text-foreground/80 text-lg">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product || !selectedSize) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Product Not Found</h1>
          <p className="text-foreground/80 mb-8 text-lg">The product you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/catalog")} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>
        </div>
      </div>
    );
  }

  // Parse images array
  const additionalImages = selectedSize.images ? JSON.parse(selectedSize.images) : [];
  const allImages = [selectedSize.imageUrl, selectedSize.moodImageUrl, ...additionalImages].filter(
    (img, index, arr) => img && arr.indexOf(img) === index
  );

  // Function to get higher quality image paths where available
  const getHighQualityImagePath = (imagePath: string): string => {
    // For images with -300x300 suffix, try to find higher quality versions
    if (imagePath.includes('-300x300')) {
      // Try removing the -300x300 suffix to get full size
      const fullPath = imagePath.replace('-300x300', '');
      return fullPath;
    }
    
    // For specific known cases where we have higher quality versions
    const highQualityMap: Record<string, string> = {
      '/assets/perfumes/3-3.jpg': '/assets/perfumes/3-3.jpg', // Already full size
      // Add more mappings as needed
    };
    
    return highQualityMap[imagePath] || imagePath;
  };

  // Map all images to potentially higher quality versions
  const highQualityImages = allImages.map(getHighQualityImagePath);

  // Generate fragrance notes based on product name and description
  const generateFragranceNotes = (name: string, description: string) => {
    const topNotes = [];
    const middleNotes = [];
    const baseNotes = [];

    if (name.toLowerCase().includes("ginger")) {
      topNotes.push("Ginger", "Lemon", "Pink Pepper");
      middleNotes.push("Cardamom", "Cinnamon");
      baseNotes.push("Amber", "Sandalwood");
    } else if (name.toLowerCase().includes("cigar") || name.toLowerCase().includes("honey")) {
      topNotes.push("Honey", "Bergamot", "Orange");
      middleNotes.push("Tobacco", "Cinnamon", "Rose");
      baseNotes.push("Vanilla", "Amber", "Leather");
    } else if (name.toLowerCase().includes("hibiscus")) {
      topNotes.push("Hibiscus", "Peach", "Mandarin");
      middleNotes.push("Jasmine", "Rose", "Lily");
      baseNotes.push("Musk", "Cedarwood", "Vanilla");
    } else if (name.toLowerCase().includes("oud")) {
      topNotes.push("Rose", "Saffron", "Bergamot");
      middleNotes.push("Oud", "Sandalwood", "Patchouli");
      baseNotes.push("Amber", "Musk", "Vanilla");
    } else if (name.toLowerCase().includes("vetiver")) {
      topNotes.push("Vetiver", "Lemon", "Green Leaves");
      middleNotes.push("Cedarwood", "Lavender");
      baseNotes.push("Sandalwood", "Musk");
    } else {
      // Default sophisticated notes
      topNotes.push("Bergamot", "Mandarin", "Pink Pepper");
      middleNotes.push("Rose", "Jasmine", "Geranium");
      baseNotes.push("Sandalwood", "Musk", "Amber");
    }

    return { topNotes, middleNotes, baseNotes };
  };

  // Use authentic fragrance notes if available, otherwise generate them
  const fragranceNotes = selectedSize.topNotes && selectedSize.middleNotes && selectedSize.baseNotes
    ? {
        topNotes: selectedSize.topNotes.split(',').map((note: string) => note.trim()),
        middleNotes: selectedSize.middleNotes.split(',').map((note: string) => note.trim()),
        baseNotes: selectedSize.baseNotes.split(',').map((note: string) => note.trim())
      }
    : generateFragranceNotes(selectedSize.name, selectedSize.description);

  return (
    <div className="min-h-screen">
      <Header 
        onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
        onToggleCart={() => setIsCartOpen(!isCartOpen)}
        onToggleAuth={() => setIsAuthOpen(!isAuthOpen)}
      />
      
      {/* Header - Valley Breezes Theme */}
      <div className="bg-card/90 backdrop-blur-glass border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/catalog")}
            className="mb-4 text-primary hover:text-accent hover:bg-primary/10 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>
          
          {/* Breadcrumb - Valley Breezes Style */}
          <nav className="text-sm text-muted-foreground">
            <span>Home</span> → <span>Catalog</span> → <span className="text-primary">{selectedSize.brand}</span> → 
            <span className="text-foreground font-medium ml-1">{selectedSize.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Image Gallery - Valley Breezes Theme */}
          <div className="space-y-6">
            <div className="aspect-square bg-gradient-to-br from-card/85 via-background/70 to-card/65 backdrop-blur-glass border border-border/60 rounded-2xl p-8 overflow-hidden relative group">
              {/* Valley Breezes luxury background patterns */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-accent/4 opacity-70"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(212,175,55,0.12),transparent_60%)] opacity-80"></div>
              
              <img
                src={highQualityImages[selectedImageIndex]}
                alt={selectedSize.name}
                className="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-500"
                loading="eager"
              />
            </div>
            
            {highQualityImages.length > 1 && (
              <div className="flex space-x-4 justify-center">
                {highQualityImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      selectedImageIndex === index
                        ? "border-primary ring-2 ring-primary/30 scale-110"
                        : "border-border/60 hover:border-primary/60 hover:scale-105"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${selectedSize.name} view ${index + 1}`}
                      className="w-full h-full object-contain bg-gradient-to-br from-card/50 to-background/30 p-3"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information - Valley Breezes Theme */}
          <div className="space-y-8">
            {/* Brand Badge - Valley Breezes Style */}
            <Badge variant="secondary" className="text-sm font-medium bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30">
              {selectedSize.brand}
            </Badge>

            {/* Product Title - Valley Breezes Typography */}
            <div>
              <h1 className="font-serif text-5xl font-bold text-gradient mb-4">{selectedSize.name}</h1>
              <p className="text-xl text-foreground/85 leading-relaxed">{selectedSize.description}</p>
            </div>

            {/* Rating and Volume - Valley Breezes Style */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < Math.floor(parseFloat(selectedSize.rating))
                          ? "text-primary fill-current"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-foreground/80">({selectedSize.rating}/5.0)</span>
              </div>
              <Separator orientation="vertical" className="h-8 bg-border" />
              <span className="text-foreground/80 font-medium">{selectedSize.volume}</span>
            </div>

            {/* Size Selection - Show if there are multiple sizes */}
            {allSizes.length > 1 && (
              <div className="p-4 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-xl">
                <h3 className="font-semibold text-foreground mb-3">Available Sizes:</h3>
                <div className="flex flex-wrap gap-3">
                  {allSizes.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedSize(p)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        selectedSize.id === p.id
                          ? 'bg-primary text-primary-foreground shadow-lg'
                          : 'bg-card/80 text-foreground hover:bg-primary/20 border border-border'
                      }`}
                    >
                      {p.volume} - {p.price} د.إ {p.inStock ? '' : '(Out of Stock)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price - Valley Breezes Gold Theme */}
            <div className="text-4xl font-bold text-gradient">
              {selectedSize.price} د.إ
            </div>

            {/* Quantity and Actions - Valley Breezes Theme */}
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <label className="text-sm font-medium text-foreground">Quantity:</label>
                <div className="flex items-center bg-card/50 backdrop-blur-sm border border-border rounded-xl">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 hover:bg-primary/10 transition-colors text-primary font-bold"
                  >
                    -
                  </button>
                  <span className="px-6 py-3 border-l border-r border-border text-foreground font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-3 hover:bg-primary/10 transition-colors text-primary font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedSize.inStock || addToCartMutation.isPending}
                  className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-3" />
                  {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleWishlistToggle}
                  className="h-14 px-5 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:-translate-y-1"
                  size="lg"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-primary text-primary" : ""}`} />
                </Button>
              </div>

              {!selectedSize.inStock && (
                <p className="text-destructive font-medium bg-destructive/10 border border-destructive/20 rounded-lg p-3">Currently out of stock</p>
              )}
            </div>

            {/* Trust Badges - Valley Breezes Theme */}
            <div className="grid grid-cols-3 gap-6 py-8 border-t border-b border-border">
              <div className="text-center group">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-4 rounded-2xl mx-auto mb-3 w-fit group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-primary mx-auto" />
                </div>
                <p className="text-sm font-medium text-foreground">100% Authentic</p>
              </div>
              <div className="text-center group">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-4 rounded-2xl mx-auto mb-3 w-fit group-hover:scale-110 transition-transform duration-300">
                  <Truck className="w-8 h-8 text-primary mx-auto" />
                </div>
                <p className="text-sm font-medium text-foreground">Fast Delivery</p>
              </div>
              <div className="text-center group">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-4 rounded-2xl mx-auto mb-3 w-fit group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-8 h-8 text-primary mx-auto" />
                </div>
                <p className="text-sm font-medium text-foreground">Premium Quality</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information Sections - Valley Breezes Theme */}
        <div className="mt-20 grid lg:grid-cols-2 gap-12">
          {/* Fragrance Notes - Valley Breezes Card Style */}
          <Card className="bg-gradient-to-br from-card/85 via-background/70 to-card/65 backdrop-blur-glass border border-border/60 shadow-2xl hover:shadow-primary/10 transition-all duration-500">
            <CardContent className="p-10">
              <h3 className="font-serif text-3xl font-bold mb-8 flex items-center text-gradient">
                <Info className="w-7 h-7 mr-4 text-primary" />
                Fragrance Notes
              </h3>
              
              <div className="space-y-8">
                <div>
                  <h4 className="font-semibold text-foreground mb-4 text-lg">Top Notes</h4>
                  <div className="flex flex-wrap gap-3">
                    {fragranceNotes.topNotes.map((note: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-sm bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 transition-colors">
                        {note}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-4 text-lg">Middle Notes</h4>
                  <div className="flex flex-wrap gap-3">
                    {fragranceNotes.middleNotes.map((note: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-sm bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 transition-colors">
                        {note}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-4 text-lg">Base Notes</h4>
                  <div className="flex flex-wrap gap-3">
                    {fragranceNotes.baseNotes.map((note: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-sm bg-secondary/20 border-secondary/30 text-secondary-foreground hover:bg-secondary/30 transition-colors">
                        {note}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Details - Valley Breezes Card Style */}
          <Card className="bg-gradient-to-br from-card/85 via-background/70 to-card/65 backdrop-blur-glass border border-border/60 shadow-2xl hover:shadow-primary/10 transition-all duration-500">
            <CardContent className="p-10">
              <h3 className="font-serif text-3xl font-bold mb-8 text-gradient">Product Details</h3>
              
              <div className="space-y-6">
                <div className="flex justify-between py-3 border-b border-border/50">
                  <span className="font-medium text-muted-foreground">Brand</span>
                  <span className="text-foreground font-semibold">{selectedSize.brand}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border/50">
                  <span className="font-medium text-muted-foreground">Volume</span>
                  <span className="text-foreground font-semibold">{selectedSize.volume}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border/50">
                  <span className="font-medium text-muted-foreground">Category</span>
                  <span className="text-foreground font-semibold capitalize">{selectedSize.category}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border/50">
                  <span className="font-medium text-muted-foreground">Rating</span>
                  <span className="text-foreground font-semibold">{selectedSize.rating}/5.0</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="font-medium text-muted-foreground">Availability</span>
                  <span className={`font-semibold ${selectedSize.inStock ? "text-primary" : "text-destructive"}`}>
                    {selectedSize.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
              </div>

              <div className="mt-10 p-6 bg-gradient-to-r from-primary/10 via-card/50 to-accent/10 backdrop-blur-sm border border-primary/20 rounded-xl">
                <h4 className="font-semibold text-primary mb-3 text-lg">Usage Recommendation</h4>
                <p className="text-foreground/80 leading-relaxed">
                  For best results, apply to pulse points such as wrists, neck, and behind ears. 
                  The fragrance will develop beautifully throughout the day, revealing different notes 
                  as it settles on your skin.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Brand Story Section - Valley Breezes Theme */}
        <Card className="bg-gradient-to-br from-card/85 via-background/70 to-card/65 backdrop-blur-glass border border-border/60 shadow-2xl hover:shadow-primary/10 transition-all duration-500 mt-12">
          <CardContent className="p-12">
            <h3 className="font-serif text-4xl font-bold mb-8 text-gradient">About {selectedSize.brand}</h3>
            <div className="prose prose-lg max-w-none text-foreground/85">
              {selectedSize.brand === "Rabdan" && (
                <p className="text-foreground/85 leading-relaxed text-lg">
                  Rabdan represents the pinnacle of luxury fragrance craftsmanship, drawing inspiration 
                  from the rich heritage of Arabian perfumery while embracing modern sophistication. 
                  Each fragrance in the Rabdan collection is meticulously crafted using the finest 
                  ingredients sourced from around the world, creating unique olfactory experiences 
                  that capture the essence of luxury and elegance.
                </p>
              )}
              {selectedSize.brand === "Signature Royale" && (
                <p className="text-foreground/85 leading-relaxed text-lg">
                  Signature Royale embodies royal elegance and timeless sophistication. Our master 
                  perfumers create exclusive fragrances that reflect the grandeur and refinement 
                  of royal courts, using precious ingredients and traditional techniques passed 
                  down through generations.
                </p>
              )}
              {selectedSize.brand === "Pure Essence" && (
                <p className="text-foreground/85 leading-relaxed text-lg">
                  Pure Essence focuses on creating clean, contemporary fragrances that celebrate 
                  the beauty of natural ingredients. Our commitment to purity and quality ensures 
                  that each fragrance delivers an authentic and memorable scent experience.
                </p>
              )}
              {selectedSize.brand === "Coreterno" && (
                <p className="text-foreground/85 leading-relaxed text-lg">
                  Coreterno pushes the boundaries of traditional perfumery with bold, innovative 
                  compositions that challenge conventional fragrance norms. Our avant-garde approach 
                  creates unique scent profiles for the modern, confident individual.
                </p>
              )}
              {!["Rabdan", "Signature Royale", "Pure Essence", "Coreterno"].includes(selectedSize.brand) && (
                <p className="text-foreground/85 leading-relaxed text-lg">
                  This prestigious fragrance brand represents excellence in perfumery, combining 
                  traditional craftsmanship with innovative techniques to create exceptional 
                  fragrances that stand the test of time.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
      
      {/* Modals and Overlays */}
      <CartSidebar 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
      <SearchOverlay 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};

export default ProductDetail;