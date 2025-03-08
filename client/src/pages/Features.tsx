import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Map, Brain, BarChart3, Mail, Users2, Sparkles } from "lucide-react";

export default function Features() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">AI-Powered Land Investment</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Landhacker combines advanced AI technology with comprehensive land data
            to help you make smarter investment decisions.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Geographic Parcel Selection */}
          <Card>
            <CardHeader>
              <Map className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Geographic Parcel Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Interactive map interface with Google Maps/Leaflet</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Real-time parcel data retrieval</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Detailed property information display</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* AI-Powered Analysis */}
          <Card>
            <CardHeader>
              <Brain className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>AI-Powered Comps Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>GPT-4o powered property valuation</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>MLS and county tax record analysis</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Historical land sales comparison</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Marketing Tools */}
          <Card>
            <CardHeader>
              <Mail className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Marketing & Outreach</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Automated direct mail campaign generation</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Customizable messaging templates</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Batch sending capabilities</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Team Collaboration */}
          <Card>
            <CardHeader>
              <Users2 className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Add team members for $10/month</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Shared analysis and insights</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Collaborative property research</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Analytics & Insights */}
          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Analytics & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Property value trends analysis</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Market opportunity identification</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Investment risk assessment</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* AI Optimization */}
          <Card>
            <CardHeader>
              <Sparkles className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>AI Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Multi-agent AI system for deep analysis</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Intelligent caching for faster results</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Continuous model improvements</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
