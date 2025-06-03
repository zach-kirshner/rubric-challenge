'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

interface ExamplePrompt {
  title: string;
  category: string;
  prompt: string;
}

const examplePrompts: ExamplePrompt[] = [
  {
    title: "Government Benefits Processing Plan",
    category: "Operations Management",
    prompt: `Since Congress hasn't passed the spending bill, we're facing a looming government shutdown. DHS has authorized the release of three months' worth of funds for everyone active on safety net benefits in the event of an extended shutdown. So, our director has charged us with processing as many applications as possible in the next three weeks. She has authorized OT, but we need to keep those hours as low as possible. Here's what we're facing:

* 4000 re-determinations (RRRs) - 1500 are overdue, 500 are due in two weeks, 700 are due in three weeks, and the rest aren't due for another month or so
* 1200 new applications - 400 are overdue, 600 are due in two weeks, 100 are due in three weeks, and the rest aren't due for another month
* We have 40 techs in total. 20 are trained in RRRs and 10 only handle med cases but they can do intake and RRRs if needed.
* 5 techs are allocated to just phone calls every day.
* RRRs take an average of 30 minutes to complete, but new applications take around 1.5 hours. We need to leave room for roughly 30 walk-ins daily, which are a mix of intake and RRRs. And we'll also have new apps and RRRs getting turned in daily.
* Our OT limit is 100 hours weekly

We need to come up with a two-tier plan to submit to the director for her approval. First priority is to get caught up and the second is to complete as many apps and RRRs as possible.`
  },
  {
    title: "Mobile Phone Revenue Strategy Analysis",
    category: "Business Strategy",
    prompt: `I work for a mobile phone company, and we sell postpaid plans. Last year's average sales were as follows: 1,100,000 subscribers, with 65% in the Eastern Australian Region and 35% in the Western Australian Region. In EA, 60% of our customers are on the $15 plan, 7% are on the $20 plan, 5% are on the $25 plan, 17% are on the $30 plan, 5% are on the $35 plan, and finally 3%, 2%, and 1% are on the $50, $80, and $100 plans, respectively.
In WA, 48% of our customers are on the $15 plan, 10% are on the $20 plan, 5% are on the $25 plan, 28% are on the $30 plan, 3% are on the $35 plan, and finally 3%, 2%, and 1% are on the $50, $80, and $100 plans, respectively.
The company's Commercial Management has requested that for the upcoming year, we must achieve at least a 3.5% increase in revenue, and we have the freedom to propose strategies focused on revenue generation (not cost reduction) such as price changes, new offers, plan improvements, promotional components, upselling, among other strategies.
At the moment, my team has provided two ideas:

Introduce a new $22 plan. This plan would offer intermediate commercial benefits between the current $20 and $25 plans. The idea is to encourage customers on the $20 plan to upgrade to the $22 plan with a promotion of one free month. This plan would be targeted at customers with high data consumption and social media usage. We project that 25% of customers on the $20 plan would upgrade to the new $22 plan.
Plan Merger: Merge the 2 least sold plans to create a single intermediate plan. In this case, merge the $35 and $50 plans to offer a single $40 plan with the benefits of the $50 plan. Existing customers with these plans can keep their current plans if they wish, but new activations would have the option of the $40 plan. We project that 60% of new sales that would have been on the $35 plan will take the $40 plan, and 30% of the sales that would have been on the $50 plan will take the $40 plan. 

I would like you to analyze which of these strategies would be more effective in achieving a 3.5% revenue increase.`
  },
  {
    title: "Office Property Acquisition Analysis",
    category: "Real Estate Analysis",
    prompt: `I need to perform due diligence on an office property acquisition at 114 Willits Street, Birmingham, MI. The seller is asking for $3.25 million. The property is 18,500 sq ft, built in 1971, and is currently configured as an office building. I need to understand the property's current condition and immediate capital needs. Create a capital improvement plan for years 1-3. Here's what I've gathered: The property underwent renovations in 1987 (lobby), 1995 (restrooms), and 2006 (replaced 3 of 5 rooftop HVAC units). The remaining 2 HVAC units are original. The flat rubber roof was replaced in 2009 with a 15-year warranty. The parking lot was resurfaced in 2012. The building has single-pane aluminum windows throughout. Current tenant (accounting firm, 5-year lease ending in 18 months) pays $18/sq ft NNN but has complained about: inconsistent heating/cooling, drafty windows in winter, and outdated lighting. Market rents for renovated office space in the area are $24-26/sq ft. The city recently announced plans to redevelop the downtown district starting in 2025. For capital planning purposes, assume: HVAC units have 20-year life, roofs 20 years, parking lots 15 years. Energy-efficient windows would reduce utility costs by 20%. LED lighting upgrade would reduce electrical consumption by 40%. Assume 3% annual inflation for all improvements. The seller claims the building needs no immediate work. Do you agree? What's your year 1-3 capital plan and budget?`
  },
  {
    title: "TouchTunes LBO Financial Model",
    category: "Private Equity Analysis",
    prompt: `From the perspective of a private equity firm evaluating an LBO acquisition of TouchTunes in February 2025, construct a detailed operating model to forecast TouchTunes' financial performance over the next five years. Include a revenue model that breaks out key input variables and explicitly calculates annual Music Service Revenue (MSR), hardware sales, and other domestic services sales based on the data provided. Incorporate the following:

• Assume a 3% annual decline in paid song plays due to competition from streaming services like Spotify, offset by a 5% annual increase in jukebox locations driven by international expansion.
• Factor in a rising cost of debt (assume a 7% interest rate on senior debt and 12% on mezzanine financing) due to macroeconomic tightening, and assume the PE firm targets a 20% IRR over a 5-year hold period.
• Account for potential regulatory risks in music licensing that could increase royalty costs by 10% starting in year 3.

Based on your operating model, estimate TouchTunes' enterprise value today and propose a bid price, assuming an entry multiple of 8x EBITDA and a leverage ratio of 5x EBITDA. What are the key drivers of revenue growth, and how do they influence the return profile of the LBO? Provide a sensitivity analysis showing how a 10% variance in song plays impacts the IRR. Use the data provided and justify any additional assumptions with industry benchmarks or trends. Data is as follows:

TouchTunes is the world's largest digital jukebox company serving bars and restaurants with a physical presence in over 61,850 locations in North America and over 11,550 locations internationally. With a network over 2.7 times larger than its nearest competitor, TouchTunes is a key music delivery channel for music licensors (Sony Music, Universal Music / EMI, Warner Music) which allows the Company to offer more than 2.0 million licensed songs to an estimated 12.5 million customers who play over 740 million paid songs annually.

With the purchase of a jukebox from TouchTunes, independent operators enter into an automatically renewing 5-year contract with the Company that provides access to the library of licensed songs, technical support, and fleet monitoring services in return for approximately 20.0% of the revenue ("coinage") generated by the jukebox ("Music Service Revenue" or "MSR"). The remaining 80.0% of gross coinage is shared between the operator and the bar / restaurant owner. The Company's high margin, low risk, asset-lite business model focuses on manufacturing jukeboxes through a third party (Flextronics) and selling the jukeboxes to independent operators and distributors (who will in turn sell to independent operators). These independent operators ultimately own the jukeboxes and therefore take the capital risk of whether a jukebox is successful in generating revenue. Independent operators are responsible for installing, repairing, and maintaining the jukeboxes at the various venues, effectively providing the Company with ~10,000 technical employees that do not burden the Company's operating expenses. TouchTunes has long and successful relationships with a network of over 2,500 independent operators with average length of relationships at over seven years. With the Company's dominant market share in North America, the majority of the Company's revenue (~77.2%) is comprised of high margin MSR while the remainder is from (~15.1%) hardware sales and (~7.7) other domestic services sales.`
  },
  {
    title: "Legal Research on Copyright Infringement",
    category: "Legal Analysis", 
    prompt: `Hi, our client is a large music publisher. Over the past 10 years, they have discovered 127 instances where commercial jingles have included musical phrases from their copyrighted songs without permission. Each instance lasted between 3-7 seconds. The company has not pursued legal action to date. They're now considering a litigation strategy and have asked us to research: (1) What is the current legal standard for "de minimis" use in copyright law, particularly for musical works used in commercial settings? Please cite the most recent circuit court decisions. (2) How have courts treated the "substantial similarity" test when the copied portion is less than 10 seconds? (3) What damages have been awarded in similar cases over the past 5 years? They're particularly interested in the 9th Circuit's position, as most infringements occurred in California. Also analyze whether waiting 10 years to bring suit could impact their claims. They want to know if they should pursue all 127 cases or focus on the most egregious ones.`
  }
];

interface ExamplePromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExamplePromptsModal({ isOpen, onClose }: ExamplePromptsModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigatePrevious();
      } else if (e.key === 'ArrowRight') {
        navigateNext();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleArrowKeys);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleArrowKeys);
    };
  }, [isOpen, onClose, currentIndex]);

  const navigatePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + examplePrompts.length) % examplePrompts.length);
  };

  const navigateNext = () => {
    setCurrentIndex((prev) => (prev + 1) % examplePrompts.length);
  };

  if (!isOpen) return null;

  const currentPrompt = examplePrompts[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] card card-elevated animate-slide-up overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: 'var(--color-card-border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <Lightbulb className="w-5 h-5" style={{ color: 'var(--gradient-mid)' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Example Prompts</h2>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                Browse through these high-quality prompt examples for inspiration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{ 
              color: 'var(--color-muted-foreground)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* Navigation indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--gradient-mid)' }}>
                {currentPrompt.category}
              </span>
              <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                • {currentIndex + 1} of {examplePrompts.length}
              </span>
            </div>
            
            {/* Navigation dots */}
            <div className="flex gap-1.5">
              {examplePrompts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                  }}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    backgroundColor: index === currentIndex 
                      ? 'var(--gradient-mid)' 
                      : 'rgba(139, 92, 246, 0.2)',
                    transform: index === currentIndex ? 'scale(1.2)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Prompt title */}
          <h3 className="text-2xl font-semibold mb-4">{currentPrompt.title}</h3>

          {/* Prompt content */}
          <div 
            className="p-6 rounded-lg" 
            style={{ 
              background: 'rgba(139, 92, 246, 0.05)',
              border: '1px solid rgba(139, 92, 246, 0.1)'
            }}
          >
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {currentPrompt.prompt}
            </pre>
          </div>

          {/* Note about viewing only */}
          <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
            <p className="text-xs" style={{ color: 'var(--gradient-mid)' }}>
              These examples are for inspiration only. Create your own unique prompt that challenges AI models in new ways.
            </p>
          </div>
        </div>

        {/* Footer with navigation */}
        <div className="flex items-center justify-between p-6 border-t flex-shrink-0" style={{ borderColor: 'var(--color-card-border)' }}>
          <button
            onClick={navigatePrevious}
            className="btn-secondary flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Use arrow keys to navigate
          </p>

          <button
            onClick={navigateNext}
            className="btn-secondary flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 