import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { usePoemSets } from "@/hooks/use-poem-sets";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: poemSets, isLoading } = usePoemSets();
  const { user } = useAuth();

  // Filter logic
  const filteredSets = poemSets?.filter(set =>
    set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    set.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-5xl font-medium mb-4">
            Explore Poem Sets
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover collections of sonnets created by our community
          </p>
        </motion.div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by title or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Sets Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading poem sets...</p>
          </div>
        ) : filteredSets && filteredSets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSets.map((set, idx) => (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link to={`/poem-set/${set.id}`}>
                  <Card className="hover:border-gold/50 transition-colors cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="font-display text-xl">
                          {set.title}
                        </CardTitle>
                        {set.user_id === user?.id && (
                          <Badge variant="secondary">Yours</Badge>
                        )}
                      </div>
                      {set.tags && set.tags.length > 0 && (
                        <CardDescription>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {set.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(set.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{set.poems.length} sonnets</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "No poem sets match your search." : "No published poem sets yet."}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Explore;
