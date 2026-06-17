{/* Summary tabs for different insight types */}
<Tabs defaultValue="overview" className="mb-4">
  <TabsList className="grid grid-cols-4 w-full mb-4">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="market">Market Analysis</TabsTrigger>
    <TabsTrigger value="industry">Industry Trends</TabsTrigger>
    <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
  </TabsList>
  
  <TabsContent value="overview">
    {(() => {
      // Get country data from our global countryData object
      const data = selectedRegion ? 
        countryData[selectedRegion] || 
        // Try matching by similar name if exact match not found
        Object.values(countryData).find(c => 
          c.name.toLowerCase().includes(selectedRegion.toLowerCase())
        ) || defaultData : defaultData;
        
      return <OverviewTab data={data} />;
    })()}
  </TabsContent>
  
  <TabsContent value="market">
    {/* Market Analysis tab content */}
    {(() => {
      const data = selectedRegion ? 
        countryData[selectedRegion] || 
        Object.values(countryData).find(c => 
          c.name.toLowerCase().includes(selectedRegion.toLowerCase())
        ) || defaultData : defaultData;
    
      // Customer segments chart data
      const customerSegments = [
        { name: "Enterprise", growth: "+4.2%", size: "36%" },
        { name: "SMB", growth: "+7.9%", size: "42%" },
        { name: "Consumer", growth: "+3.5%", size: "22%" }
      ];
      
      return (
        <div className="space-y-6">
          {/* Market Size & Growth */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3">Market Size & Growth</h3>
              <div className="flex flex-col space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600 text-sm">Market Size</div>
                    <div className="text-2xl font-bold">{data.marketSize}</div>
                    <div className="text-xs text-gray-500 mt-1">Total addressable market</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600 text-sm">Growth Rate</div>
                    <div className="text-2xl font-bold text-green-600">{data.growthRate}</div>
                    <div className="text-xs text-gray-500 mt-1">Annual market growth</div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <h4 className="text-sm font-medium mb-1">Market Saturation</h4>
                  <div className="h-3 bg-gray-200 rounded-full">
                    <div className="h-3 bg-blue-500 rounded-full" style={{ width: '46%' }}></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-600">
                    <span>46% saturated</span>
                    <span>54% untapped potential</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                <p>Source: Market Analysis Institute, 2024</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3">Customer Segments</h3>
              <div className="space-y-3">
                {customerSegments.map((segment, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium">{segment.name}</div>
                        <div className="text-sm">{segment.size}</div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full w-full">
                        <div 
                          className={`h-2 rounded-full ${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-green-500' : 'bg-purple-500'}`} 
                          style={{ width: segment.size }}
                        ></div>
                      </div>
                    </div>
                    <div className="ml-4 text-sm text-green-600 font-medium">{segment.growth}</div>
                  </div>
                ))}
                
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-medium mb-2">Growth Drivers</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>Expanding digital transformation initiatives</li>
                    <li>Increasing demand for sustainable solutions</li>
                    <li>Growing investment in infrastructure</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Competitive Landscape */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3">Competitive Landscape</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-center mb-2">Market Leaders</h4>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded flex justify-between items-center">
                    <span>Company A</span>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">28% share</span>
                  </div>
                  <div className="p-2 bg-gray-50 rounded flex justify-between items-center">
                    <span>Company B</span>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">22% share</span>
                  </div>
                  <div className="p-2 bg-gray-50 rounded flex justify-between items-center">
                    <span>Company C</span>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">15% share</span>
                  </div>
                </div>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-center mb-2">Fast Growing</h4>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded flex justify-between items-center">
                    <span>Startup X</span>
                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded">+82%</span>
                  </div>
                  <div className="p-2 bg-gray-50 rounded flex justify-between items-center">
                    <span>Startup Y</span>
                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded">+65%</span>
                  </div>
                  <div className="p-2 bg-gray-50 rounded flex justify-between items-center">
                    <span>Startup Z</span>
                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded">+51%</span>
                  </div>
                </div>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-center mb-2">Market Consolidation</h4>
                <div className="flex justify-center items-center h-full">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">7</div>
                    <div className="text-gray-600 text-sm">M&A deals in past year</div>
                    <div className="mt-2 text-sm text-gray-500">Total value: $1.4B</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <p>Source: Industry Competition Database, 2024</p>
            </div>
          </div>
        </div>
      );
    })()}
  </TabsContent>
  
  <TabsContent value="industry">
    {/* Industry Trends tab content */}
    {(() => {
      const data = selectedRegion ? 
        countryData[selectedRegion] || 
        Object.values(countryData).find(c => 
          c.name.toLowerCase().includes(selectedRegion.toLowerCase())
        ) || defaultData : defaultData;
      
      // Icons for different industries
      const getIndustryIcon = (industry: string) => {
        const name = industry.toLowerCase();
        if (name.includes("tech")) return <Cpu className="h-4 w-4" />;
        if (name.includes("healthcare")) return <HeartPulse className="h-4 w-4" />;
        if (name.includes("finance")) return <DollarSign className="h-4 w-4" />;
        if (name.includes("energy")) return <Zap className="h-4 w-4" />;
        if (name.includes("manufacturing")) return <Factory className="h-4 w-4" />;
        if (name.includes("retail")) return <ShoppingCart className="h-4 w-4" />;
        if (name.includes("agriculture")) return <Leaf className="h-4 w-4" />;
        if (name.includes("mining")) return <Pickaxe className="h-4 w-4" />; 
        if (name.includes("tourism")) return <Plane className="h-4 w-4" />;
        if (name.includes("electronics")) return <Smartphone className="h-4 w-4" />;
        if (name.includes("automotive")) return <Car className="h-4 w-4" />;
        if (name.includes("robotics")) return <Bot className="h-4 w-4" />;
        if (name.includes("e-commerce")) return <ShoppingBag className="h-4 w-4" />;
        if (name.includes("luxury")) return <Diamond className="h-4 w-4" />;
        if (name.includes("aerospace")) return <PlaneTakeoff className="h-4 w-4" />;
        if (name.includes("food")) return <UtensilsCrossed className="h-4 w-4" />;
        if (name.includes("renewable") || name.includes("green")) return <Wind className="h-4 w-4" />;
        if (name.includes("entertainment")) return <Music className="h-4 w-4" />;
        if (name.includes("semiconductor")) return <Cpu className="h-4 w-4" />;
        if (name.includes("education")) return <GraduationCap className="h-4 w-4" />;
        if (name.includes("real estate")) return <Building className="h-4 w-4" />;
        if (name.includes("infrastructure")) return <Construction className="h-4 w-4" />;
        return <Briefcase className="h-4 w-4" />;
      };
      
      return (
        <div className="space-y-6">
          {/* Top Industries */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3">Top Industries by Growth</h3>
            <div className="grid grid-cols-1 gap-3">
              {data.industries.slice(0, 6).sort((a, b) => {
                return parseFloat(b.growth.replace('%', '')) - parseFloat(a.growth.replace('%', ''));
              }).map((industry, index) => (
                <div key={index} className="flex items-center p-2 border border-gray-100 rounded-lg">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                    {getIndustryIcon(industry.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{industry.name}</div>
                      <div className="text-green-600 font-medium">{industry.growth}</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${industry.value}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <p>Source: Industry Growth Index, 2024</p>
            </div>
          </div>
          
          {/* Industry Disruption */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3">Innovation & Disruption</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">AI & Automation</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    AI adoption increased by 42% across industries, with manufacturing, healthcare, 
                    and financial services leading implementation.
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Sustainable Practices</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    67% of companies have incorporated sustainability initiatives, driven by 
                    consumer demand and regulatory requirements.
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Digital Transformation</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    91% of enterprises have accelerated digital initiatives, with cloud migration and 
                    remote work capabilities as top priorities.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3">Emerging Trends</h3>
              <div className="space-y-2">
                <div className="flex items-center p-2 bg-gray-50 rounded-lg">
                  <div className="p-1.5 rounded-full bg-orange-100 text-orange-600 mr-2">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-sm">Remote Work & Distributed Teams</div>
                  <div className="text-xs font-medium px-2 py-0.5 bg-orange-100 text-orange-800 rounded">Mainstream</div>
                </div>
                <div className="flex items-center p-2 bg-gray-50 rounded-lg">
                  <div className="p-1.5 rounded-full bg-purple-100 text-purple-600 mr-2">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-sm">Circular Economy Business Models</div>
                  <div className="text-xs font-medium px-2 py-0.5 bg-purple-100 text-purple-800 rounded">Growing</div>
                </div>
                <div className="flex items-center p-2 bg-gray-50 rounded-lg">
                  <div className="p-1.5 rounded-full bg-blue-100 text-blue-600 mr-2">
                    <Rocket className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-sm">Metaverse & Extended Reality</div>
                  <div className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-800 rounded">Emerging</div>
                </div>
                <div className="flex items-center p-2 bg-gray-50 rounded-lg">
                  <div className="p-1.5 rounded-full bg-green-100 text-green-600 mr-2">
                    <Leaf className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-sm">Net-Zero Commitments</div>
                  <div className="text-xs font-medium px-2 py-0.5 bg-green-100 text-green-800 rounded">Growing</div>
                </div>
                <div className="flex items-center p-2 bg-gray-50 rounded-lg">
                  <div className="p-1.5 rounded-full bg-red-100 text-red-600 mr-2">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-sm">Cybersecurity Mesh Architecture</div>
                  <div className="text-xs font-medium px-2 py-0.5 bg-red-100 text-red-800 rounded">Emerging</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    })()}
  </TabsContent>
  
  <TabsContent value="risk">
    {/* Risk Assessment tab content */}
    {(() => {
      const data = selectedRegion ? 
        countryData[selectedRegion] || 
        Object.values(countryData).find(c => 
          c.name.toLowerCase().includes(selectedRegion.toLowerCase())
        ) || defaultData : defaultData;
      
      const riskBadgeClass = data.riskLevel === 'low' 
        ? 'bg-green-100 text-green-800' 
        : data.riskLevel === 'medium'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-red-100 text-red-800';
      
      // Risk category scores
      const riskCategories = [
        { name: "Political", score: data.riskLevel === 'low' ? 28 : data.riskLevel === 'medium' ? 54 : 76 },
        { name: "Economic", score: data.riskLevel === 'low' ? 32 : data.riskLevel === 'medium' ? 58 : 82 },
        { name: "Social", score: data.riskLevel === 'low' ? 25 : data.riskLevel === 'medium' ? 48 : 67 },
        { name: "Technological", score: data.riskLevel === 'low' ? 22 : data.riskLevel === 'medium' ? 42 : 59 },
        { name: "Legal", score: data.riskLevel === 'low' ? 18 : data.riskLevel === 'medium' ? 45 : 63 },
        { name: "Environmental", score: data.riskLevel === 'low' ? 30 : data.riskLevel === 'medium' ? 51 : 71 }
      ];
      
      // Get risk color based on score
      const getRiskColor = (score: number) => {
        if (score < 40) return 'bg-green-500';
        if (score < 60) return 'bg-yellow-500';
        return 'bg-red-500';
      };
      
      return (
        <div className="space-y-6">
          {/* Risk Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Risk Assessment</h3>
                <span className={`px-3 py-1 rounded text-xs font-medium uppercase ${riskBadgeClass}`}>
                  {data.riskLevel} risk
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Overall Business Risk</h4>
                  <div className="h-4 bg-gray-200 rounded-full">
                    <div 
                      className={`h-4 rounded-full ${data.riskLevel === 'low' ? 'bg-green-500' : data.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: data.riskLevel === 'low' ? '30%' : data.riskLevel === 'medium' ? '60%' : '85%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-600">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-medium mb-2">Key Risk Factors</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    {data.riskFactors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-medium mb-2">Risk Trend</h4>
                  <div className="flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    <span className="text-sm">Risk level is stable with careful monitoring advised</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3">Risk Categories (PESTLE)</h3>
              <div className="space-y-3">
                {riskCategories.map((category, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{category.name}</span>
                      <span className="text-sm font-medium">{category.score}/100</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-2 rounded-full ${getRiskColor(category.score)}`} 
                        style={{ width: `${category.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Mitigation Strategies */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3">Mitigation Strategies</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-medium">Strategic Approaches</h4>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>Diversify market presence and supply chains</li>
                  <li>Establish local partnerships to navigate regulations</li>
                  <li>Develop flexible business models adaptable to changes</li>
                  <li>Monitor political landscape and policy trends</li>
                </ul>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <FileCog className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-medium">Operational Measures</h4>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>Implement robust contingency planning</li>
                  <li>Secure flexible financing options</li>
                  <li>Adopt digital transformation to increase agility</li>
                  <li>Enhance cybersecurity and data protection</li>
                </ul>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <Scale className="h-5 w-5 text-purple-600 mr-2" />
                  <h4 className="font-medium">Compliance & Reporting</h4>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>Strengthen local legal and regulatory expertise</li>
                  <li>Implement comprehensive risk management frameworks</li>
                  <li>Maintain transparency with stakeholders</li>
                  <li>Regular monitoring of regulatory developments</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <p>Source: Global Risk Intelligence Institute, 2024</p>
            </div>
          </div>
        </div>
      );
    })()}
  </TabsContent>
</Tabs>