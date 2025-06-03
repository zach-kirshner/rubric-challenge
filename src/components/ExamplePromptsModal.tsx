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

Introduce a new $22 plan. This plan would offer intermediate commercial benefits between the current $20 and $25 plans. The idea is to encourage customers on the $20 plan to upgrade to the $22 plan with a promotion of one free monthly fee. There is also a risk that some customers from the $25 or higher plans might downgrade to the $22 plan to save money. The attached reference is the market research report that shows the expected impact historically when similar initiatives have been implemented.

Increase the $15 plan to $16. This simpler strategy involves replacing the $15 plan with a $16 plan while offering additional service benefits. This change would affect both new and current customers, which is supported by our legal contract but may create a negative impact in our most loyal customer base. The market research also has information about the expected outcome.

Please help me evaluate these two alternatives to determine their effectiveness, given the assumptions. Additionally, suggest another alternative, if necessary, to assure senior management that we will meet our revenue target. Present an introduction of the case, a summary of each idea and a comparative table including pros and cons, the implementation effort in at least 3 bullets points and the economic impact of each strategy in millions of dollars.`
  },
  {
    title: "Office Property Acquisition Valuation",
    category: "Real Estate Analysis",
    prompt: `We are preparing an acquisition valuation for a rack-rented office property in a secondary location. The tenant is 3 years into a 10 year lease, with a break clause at the end of year 5, and a passing rent of £37.50 per sq ft that has been paid since commencement of the lease. We are aware of a new office development in the area that is expected to be completed in the next 12 months.

Market research shows that there are 5 properties that are comparable in terms of their quality, type, size, location and lease length, with each having been recently leased at between £40 and £44 per sq ft. Each had some level of tenant incentive, although full details of this have not been published. There are no comparable sales transactions within the last 12 months, so wider industry benchmarks will be used to decide the yield that should be applied.

Create a briefing document (between 1,000 and 1.500 words) for internal use to aid the valuation process and advise on the most suitable techniques. The briefing must consider the attached RICS guidance, and include:

* How comparable evidence will be used, if any adjustments are required, and any assumptions that will be made regarding the evidence.
* Discussion of the valuation of this reversionary freehold, and whether a term and reversion, equivalent yield or layer approach would be most appropriate.
* Include an example calculation for each approach, highlighting the difference in outcome, and the potential criticisms and limitations of split yield approaches that the team should be aware of.`
  },
  {
    title: "Academic Impact Policy Resources",
    category: "Policy Development",
    prompt: `In my role as director of impact in my academic department, I have been tasked with developing three effective pieces of advice for colleagues. They are:

A process for mapping stakeholders in academic research to be used to identify stakeholders and guide targeted interactions with them
Recommendations for developing an overarching policy narrative to articulate the value of a body of research to policy-making
Recommendations for writing policy briefing papers targeting specific stakeholder groups.

The aim of these pieces is to provide individual colleagues with a quick yet authoritative reference guide for targeting United Kingdom policy impact with their own research. Write me the content for each of the three resources with a maximum count of 300 words per resource.`
  },
  {
    title: "Legal Research on Copyright Circumvention",
    category: "Legal Analysis",
    prompt: `Citing publicly available judicial decisions, please write a legal memo of no more than 1500 words analyzing whether the U.S. District Court for the Northern District of Indiana has adopted the position of the U.S. Court of Appeals for the Fifth Circuit or the position of the U.S. Court of Appeals for the Ninth Circuit on the question of whether a claim for unauthorized circumvention, under 17 U.S.C. § 1201(a), must fail where a plaintiff cannot demonstrate a nexus between the defendant's alleged circumvention and infringement of the plaintiff's copyright.

Ensure that your legal analysis reflects the state of the law as of February 13, 2025. Please include links to all web pages where you found information used in your memo.`
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