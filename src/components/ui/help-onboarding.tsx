"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { 
  HelpCircle, 
  BookOpen, 
  Video, 
  MessageCircle, 
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface HelpStep {
  id: string;
  title: string;
  description: string;
  content: string;
  completed: boolean;
}

interface HelpOnboardingProps {
  className?: string;
}

const helpSteps: HelpStep[] = [
  {
    id: "welcome",
    title: "Welcome to Kharwa Samaj",
    description: "Get started with managing your community",
    content: "Welcome! This guide will help you understand the key features of Kharwa Samaj. You can access this help anytime from the dashboard.",
    completed: false
  },
  {
    id: "members",
    title: "Managing Members",
    description: "Add and organize community members",
    content: "Use the Members section to add new members, view profiles, and manage family relationships. You can also search and filter members by various criteria.",
    completed: false
  },
  {
    id: "inventory",
    title: "Inventory Management",
    description: "Track community assets and rentals",
    content: "Manage your community's inventory items and track rentals. Set stock levels and get alerts when items are running low.",
    completed: false
  },
  {
    id: "payments",
    title: "Payment Collection",
    description: "Handle fees, donations, and rent",
    content: "Record payments for membership fees, donations, and facility rentals. Generate invoices and track payment history.",
    completed: false
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    description: "View insights and generate reports",
    content: "Access detailed reports on member growth, financial performance, and community activities. Export data for external analysis.",
    completed: false
  }
];

export function HelpOnboarding({ className }: HelpOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const currentHelpStep = helpSteps[currentStep];
  const progress = (completedSteps.size / helpSteps.length) * 100;

  const markStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const nextStep = () => {
    if (currentStep < helpSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeHelp = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn("fixed bottom-6 right-6 z-50 shadow-lg", className)}
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        Help & Onboarding
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Help & Onboarding
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeHelp}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {helpSteps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Current Step Content */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {currentHelpStep.title}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {currentHelpStep.description}
              </p>
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <p className="text-sm leading-relaxed">
                  {currentHelpStep.content}
                </p>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2">
              {helpSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-200",
                    index === currentStep
                      ? "bg-primary"
                      : completedSteps.has(step.id)
                      ? "bg-success"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => markStepComplete(currentHelpStep.id)}
                  disabled={completedSteps.has(currentHelpStep.id)}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark Complete
                </Button>

                {currentStep < helpSteps.length - 1 ? (
                  <Button
                    onClick={nextStep}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={closeHelp}
                    className="flex items-center gap-2"
                  >
                    Finish
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Quick Help Tooltip Component
export function QuickHelp({ 
  title, 
  content, 
  children 
}: { 
  title: string; 
  content: string; 
  children: React.ReactNode; 
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </div>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-popover text-popover-foreground rounded-lg border p-3 shadow-lg max-w-xs">
            <h4 className="font-medium text-sm mb-1">{title}</h4>
            <p className="text-xs text-muted-foreground">{content}</p>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover" />
          </div>
        </div>
      )}
    </div>
  );
}
