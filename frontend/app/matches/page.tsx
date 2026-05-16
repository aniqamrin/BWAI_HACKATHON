"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Star, PersonAdd, RefreshCw, Filter, MessageCircle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  image: string;
  matchScore: number;
  matchReason: string;
  expertise: string[];
  isTopMatch?: boolean;
}

const mentors: Mentor[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    title: "CMO at GrowthFlow AI",
    company: "GrowthFlow AI",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGLOicMx-S66uHCre2w8xw-TyVwxoSHL6uISQaO3iYGc5Ypb4atDe_dA6h_h03D6HZcnjSKY5eTekQQGRIKomhYVrDZxZSONbhLvS8kySfo5mZU4fGGT3x_Pg9AThFK-sJgK-sVJ319qvvfisByWfxY4GEZNCXm4EsDW1yj2gC4KAhFZgI0zb2ywD-7uD_EcjMXYFhUYg7vFh7EhTvBuhKRYMskfSNPCw-39IHhdqhhrb7ijdvqdx5zYfvr9JJ9Oq93Daq4FxDxxs",
    matchScore: 94,
    matchReason: "Sarah successfully scaled three startups using the exact AI-driven marketing tech stack you're currently implementing. Her expertise in 'Generative SEO' aligns perfectly with your 6-month goal.",
    expertise: ["B2B SaaS", "Series B Growth", "AI Marketing"],
    isTopMatch: true,
  },
  {
    id: "2",
    name: "Marcus Chen",
    title: "Head of Product, MetaLabs",
    company: "MetaLabs",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXnHueZpVROhJHq82MXgAIdAhiY8reLzEUKJq9nsoBWKTDQnn9AM_IJpYT3R_ht0btG4iVj5do5Xh15gDGXbO8Qoyq0Z8EcbDMvyBKhFMF-HhLx3O52BMUN7EwvMPfO6_wTLkk9rcC6lHvzjxXO5bXaoM1kjg6ZkvdtC8Hcs-YsLcCj6-Kd0UtmFRWlQWr6vi1V3goHvhewy-sT0k9uz5S0e2vJ0UZ-VCOZQz99I2F9moWkwuL78DUiq1GotARhG3sGYrbcfd8iYk",
    matchScore: 89,
    matchReason: "Marcus is a specialist in user acquisition and product-led growth. His background in data science complements your technical needs for performance tracking.",
    expertise: ["Product Strategy", "Data Science", "Growth"],
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    title: "Marketing Specialist, NeoBrand",
    company: "NeoBrand",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1yTUhwxQmM8m3IRdGI_Ar18I6qcAAKxir3SHh4D7W43U-XICM6D4kYLcX5iAvYwP8Hl5FpAs15Cl7y8Rla3IVAr5APGoy1keUnDqtNfIQIbLUxvb81vOD-uFty-sdcoPEIK_TsXMMQBExbvs4NRx_pSsGkMUeaW3So7QvKhnEbVkrm7WtOFZLDMZBH29YkG76U4CD4eiM1X11Owh66Ky3tHcs5TT5s4PSPiYlc8dMlw0oHkRnxjh5DTsLSfpM1kgu4qG5h-AQ2Zc",
    matchScore: 87,
    matchReason: "Elena excels at brand storytelling and community building. Her recent work with viral AI campaigns is a high-value match for your current project.",
    expertise: ["Branding", "Viral Content", "Community"],
  },
];

const MatchScoreCircle = ({ percentage }: { percentage: number }) => {
  return (
    <div className="relative h-20 w-20 flex items-center justify-center">
      <svg
        className="absolute inset-0"
        width="80"
        height="80"
        viewBox="0 0 80 80"
      >
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="rgb(229, 231, 255)"
          strokeWidth="2"
        />
        <motion.circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="rgb(4, 127, 207)"
          strokeWidth="2"
          strokeDasharray={`${2 * Math.PI * 36}`}
          strokeDashoffset={`${2 * Math.PI * 36 * (1 - percentage / 100)}`}
          strokeLinecap="round"
          initial={{ strokeDashoffset: `${2 * Math.PI * 36}` }}
          animate={{ strokeDashoffset: `${2 * Math.PI * 36 * (1 - percentage / 100)}` }}
          transition={{ duration: 1, delay: 0.5 }}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-lg text-primary">{percentage}%</span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
          MATCH
        </span>
      </div>
    </div>
  );
};

export default function MatchesPage() {
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);

  const handleAddMentor = (mentorId: string) => {
    setSelectedMentor(mentorId);
    setTimeout(() => setSelectedMentor(null), 1500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              AI Analysis Complete
            </span>
          </div>
          <h1 className="text-4xl font-bold">Your Mentor Match Results</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            We've analyzed 2,500+ professionals to find the perfect guidance for
            your current growth trajectory in Marketing and AI Integration.
          </p>
        </motion.div>

        {/* Mentor Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {mentors.map((mentor, idx) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card
                className={cn(
                  "relative flex flex-col h-full overflow-hidden transition-all hover:shadow-lg",
                  mentor.isTopMatch
                    ? "border-2 border-primary bg-gradient-to-br from-primary/5 to-blue-600/5"
                    : "border border-white/10"
                )}
              >
                {/* Top Match Badge */}
                {mentor.isTopMatch && (
                  <motion.div
                    initial={{ scale: 0, y: -10 }}
                    animate={{ scale: 1, y: 0 }}
                    className="absolute -top-3 left-6 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10"
                  >
                    <Star className="w-3 h-3" />
                    TOP MATCH
                  </motion.div>
                )}

                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Profile Section */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md mb-3">
                          <img
                            src={mentor.image}
                            alt={mentor.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <MatchScoreCircle percentage={mentor.matchScore} />
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="text-lg font-bold">{mentor.name}</h3>
                      <p className="text-sm text-primary font-semibold mb-2">
                        {mentor.title}
                      </p>

                      {/* Match Reason */}
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold text-primary uppercase">
                            Match Reason
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground italic leading-relaxed">
                          "{mentor.matchReason}"
                        </p>
                      </div>
                    </div>

                    {/* Expertise Tags */}
                    <div className="flex flex-wrap gap-2">
                      {mentor.expertise.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <motion.button
                        onClick={() => handleAddMentor(mentor.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                          mentor.isTopMatch
                            ? "bg-primary text-white hover:bg-primary/90"
                            : "bg-secondary/20 text-secondary hover:bg-secondary/30",
                          selectedMentor === mentor.id &&
                            "ring-2 ring-green-500 ring-offset-2"
                        )}
                      >
                        <PersonAdd className="w-4 h-4" />
                        {selectedMentor === mentor.id ? "Added!" : "Add Mentor"}
                      </motion.button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Feedback Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-secondary/10 border border-secondary/20 rounded-2xl p-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Not quite what you're looking for?
              </h3>
              <p className="text-muted-foreground">
                Refine your preferences to help the AI find a more specific match
                for your needs.
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none">
                <Filter className="w-4 h-4 mr-2" />
                Refine Search
              </Button>
              <Button className="flex-1 md:flex-none">
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate New Matches
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
