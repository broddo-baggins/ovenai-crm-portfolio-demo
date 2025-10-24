import { ConversationLibrary } from './types';

export const englishConversations: ConversationLibrary = {
  hooks: [
    "Hi 🙂 I saw you're interested in the Herzliya Marina area - want to hear about the new sea-view apartments?",
    "Hello! I saw you checked out our luxury units in Herzliya Pituach. Do you have 5 minutes to discuss the project details?",
    "Hi, Sharon here from the Sea Towers project - I've got detailed floor plans and timelines ready. Are you looking for a home or an investment?",
    "Hi there! Michal from Seaside Towers. I noticed you were browsing our family-friendly units - do you have children?",
    "Hello! Michal from Marina Heights. I saw your interest in our luxury penthouses. Are you looking for something move-in ready?",
    "Hi! Michal from Oceanview Residences. I noticed you were checking out our investment opportunities near the university."
  ],

  flows: [
    {
      id: "living-young-couple",
      scenario: "Young couple · Home · Light-rail commute",
      messages: [
        ["agent", "Hi David! I saw you're interested in 3-bedroom apartments near the light-rail. Are you looking for something for your family?"],
        ["lead", "Hey, yes! We're a young couple and need an easy commute to Tel Aviv."],
        ["agent", "Perfect! We have 3-room units from the 12th floor up, just a 7-minute walk to the new light-rail. Sound relevant?"],
        ["lead", "Definitely sounds interesting."],
        ["agent", "Great. They all come with underground parking and a storage room. How about a quick meeting with our sales manager to see the units?"],
        ["lead", "Sure."],
        ["agent", "He's free today at 6 pm or tomorrow at 10:30 am. Which works?"],
        ["lead", "Today at 6."],
        ["agent", "Perfect! I've scheduled a meeting with our sales manager for 6 pm - https://calendly.com/marina-towers-sales CALENDAR"]
      ]
    },

    {
      id: "investor-airbnb",
      scenario: "Investor · Airbnb yield",
      messages: [
        ["agent", "Hello Michael! I noticed you've been researching short-term rental opportunities near the marina. Are you looking at investment properties?"],
        ["lead", "Yes, I heard you can run Airbnb there. What are the details?"],
        ["agent", "Absolutely. Studio and 2-bedroom units are short-let approved, with about 70% occupancy rates. Are you after monthly yield or capital gain too?"],
        ["lead", "Mostly monthly yield."],
        ["agent", "A studio nets around 6.8% annually with the current market demand. Want to meet our sales manager for detailed market analysis?"],
        ["lead", "When could we meet?"],
        ["agent", "Tomorrow at 11 am or 5 pm in our Herzliya office. Which suits you?"],
        ["lead", "5 pm."],
        ["agent", "Perfect! Meeting confirmed for 5 pm with our investment specialist - https://calendly.com/marina-investment-sales CALENDAR"]
      ]
    },

    {
      id: "family-schools",
      scenario: "Big family · Schools · Penthouse",
      messages: [
        ["agent", "Hi Jennifer! I saw your inquiry about family-friendly properties. You mentioned you have children - how many are we talking about?"],
        ["lead", "We've got four kids. What are the schools like nearby?"],
        ["agent", "Perfect area for large families! Primary 'Ofek' is a 5-minute walk, 'Re'ut' middle school 7 minutes, and a sports center with a pool across the street. Do you need 5 or 6 bedrooms?"],
        ["lead", "Six if possible."],
        ["agent", "We have a 6-bedroom penthouse on the 20th floor with full sea views. How about a meeting with the sales manager to see the plans?"],
        ["lead", "We'd rather come in person."],
        ["agent", "Great. We're open Mon-Thu 10-6 and Fri 9-12. Is Thursday 2 pm OK?"],
        ["lead", "Works for us."],
        ["agent", "Excellent! Thursday 2 pm confirmed at our sales office - https://calendly.com/marina-family-sales CALENDAR"]
      ]
    },

    {
      id: "tech-worker-commute",
      scenario: "Tech commuter · Budget 3M ₪",
      messages: [
        ["lead", "Hi, I work in Tel Aviv and I'm looking at properties in Herzliya. How's the commute time?"],
        ["agent", "Hi Alex! Michal from Marina Towers. Great question! The Green line gets you to Carlebach in just 17 minutes. What's your budget range?"],
        ["lead", "Around 3 million shekel. Do you have anything in that range?"],
        ["agent", "Perfect! We have a 4-room on the 15th floor at 3.05M, with smart parking and great city views."],
        ["lead", "That sounds promising. Can we schedule a call to discuss details?"],
        ["agent", "Absolutely! How about tonight at 8 pm for a quick call?"],
        ["lead", "That works for me."],
        ["agent", "Perfect! I've scheduled a call for 8 pm tonight - https://calendly.com/marina-tech-sales CALENDAR"]
      ]
    },

    {
      id: "followup-hesitant",
      scenario: "Reminder · Didn't book · Books",
      messages: [
        ["agent", "Hi again - did you get a chance to pick a time with the sales manager?"],
        ["lead", "Not yet, the link didn't load."],
        ["agent", "No worries. Open slots: today 4 pm, tomorrow 11:30 am or 6 pm. Want me to lock one for you?"],
        ["lead", "11:30 am, please."],
        ["agent", "Done! Meeting confirmed for 11:30 am tomorrow - https://calendly.com/marina-followup-sales CALENDAR"]
      ]
    },

    {
      id: "value-conscious",
      scenario: "Value-conscious buyer · Lead asks questions · Location benefits",
      messages: [
        ["lead", "What makes this location special compared to other areas?"],
        ["agent", "Great question! The Marina location offers beachfront access, premium shopping at Arena Mall, and excellent train connectivity to Tel Aviv and Haifa."],
        ["lead", "That does sound appealing."],
        ["agent", "Plus the area has seen 12% property value growth over the past two years. Want to chat with our sales manager about available units?"],
        ["lead", "Yes, that would be helpful."],
        ["agent", "Tomorrow at noon or 5:30 pm - what's better?"],
        ["lead", "5:30 pm."],
        ["agent", "Perfect! Meeting scheduled for 5:30 pm tomorrow - https://calendly.com/marina-value-sales CALENDAR"]
      ]
    },

    {
      id: "retired-couple",
      scenario: "Retired couple · Downsizing · Medical facilities",
      messages: [
        ["agent", "Hi Ruth! Michal from Seaside Gardens. I saw you're interested in our smaller 2-bedroom units. Are you looking to downsize?"],
        ["lead", "Yes, my husband and I are retired and want something more manageable. How close are medical facilities?"],
        ["agent", "Perfect choice! Meir Hospital is just 8 minutes away, and we have a pharmacy and medical center in the building complex."],
        ["lead", "That's reassuring. What about transportation for non-drivers?"],
        ["agent", "Excellent public transport! Bus stops right outside, and we offer a shuttle service to the mall and medical center twice daily."],
        ["lead", "Sounds like exactly what we need. Can we visit this week?"],
        ["agent", "Absolutely! Let me arrange a comfortable tour with our senior living specialist - https://calendly.com/seaside-senior-sales CALENDAR"]
      ]
    },

    {
      id: "religious-family",
      scenario: "Religious family · Kosher amenities · Community",
      messages: [
        ["agent", "Hi Sarah! Michal from Eden Heights. I noticed your interest in our family units. I should mention we have excellent religious amenities nearby."],
        ["lead", "That's important to us. Are there synagogues and kosher facilities in the area?"],
        ["agent", "Absolutely! Three synagogues within walking distance, including one with daily minyan. Plus a kosher supermarket and mikvah."],
        ["lead", "What about Jewish schools for the children?"],
        ["agent", "Great question! 'Netivot' religious elementary school is 5 minutes away, and 'Bnei Akiva' high school is accessible by school bus."],
        ["lead", "This sounds perfect for our family. I need to discuss with my husband first."],
        ["agent", "Of course! It's a big decision. When you're ready, let's schedule a family visit - https://calendly.com/eden-religious-sales CALENDAR"]
      ]
    },

    {
      id: "international-buyer",
      scenario: "International buyer · Investment · Property management",
      messages: [
        ["agent", "Hello Robert! Michal from Global Properties Herzliya. I see you're inquiring from overseas about investment opportunities here."],
        ["lead", "Yes, I'm based in New York but looking to invest in Israeli real estate. Do you handle international clients?"],
        ["agent", "Absolutely! About 30% of our clients are international investors. We offer full property management and rental services."],
        ["lead", "What's the typical rental yield, and how do you handle maintenance?"],
        ["agent", "Current yields are 4-5% annually, and we have a full concierge service for maintenance, tenant management, and financial reporting."],
        ["lead", "Interesting. Can we schedule a video tour since I can't visit in person right now?"],
        ["agent", "Perfect solution! Let me set up a live virtual tour with our international sales manager - https://calendly.com/global-virtual-sales CALENDAR"]
      ]
    },

    {
      id: "young-professional",
      scenario: "Young professional · First apartment · Modern amenities",
      messages: [
        ["agent", "Hi Lisa! Michal from Urban Living Herzliya. I saw you're looking at our studio and 1-bedroom units. Is this your first apartment purchase?"],
        ["lead", "Yes! I just started working and want something modern and low-maintenance. What amenities do you have?"],
        ["agent", "Great choice for a first home! We have a rooftop pool, fully equipped gym, co-working spaces, and 24/7 concierge."],
        ["lead", "That sounds amazing! Is there good nightlife and restaurants nearby?"],
        ["agent", "Definitely! The Marina district has excellent restaurants, bars, and it's just 15 minutes to Tel Aviv's nightlife scene."],
        ["lead", "Perfect! When can I see some units?"],
        ["agent", "How about this weekend? Let me schedule you with our young professionals specialist - https://calendly.com/urban-lifestyle-sales CALENDAR"]
      ]
    },

    {
      id: "growing-family",
      scenario: "Growing family · Expecting baby · Safe neighborhood",
      messages: [
        ["agent", "Hi Daniel! Michal from Family First Residences. I see you're looking at 3-bedroom units. Planning to expand the family?"],
        ["lead", "Actually yes! We're expecting our first baby and need more space. How safe is the neighborhood?"],
        ["agent", "Congratulations! It's one of the safest areas in Herzliya - gated community with 24/7 security and very family-oriented."],
        ["lead", "That's reassuring. Are there pediatricians and baby facilities nearby?"],
        ["agent", "Absolutely! Schneider Children's Hospital is 10 minutes away, plus several pediatric clinics and a baby supply store in the area."],
        ["lead", "We'd love to visit before the baby arrives. How soon can we schedule?"],
        ["agent", "Let's get you in this week! I'll arrange a tour focusing on family features - https://calendly.com/family-first-sales CALENDAR"]
      ]
    },

    {
      id: "active-lifestyle",
      scenario: "Active lifestyle · Sports facilities · Beach access",
      messages: [
        ["agent", "Hi Mark! Michal from SportLife Marina. I noticed you're interested in our beach-adjacent units. Are you into water sports?"],
        ["lead", "Absolutely! I'm looking for somewhere with direct beach access and sports facilities. What do you have?"],
        ["agent", "Perfect match! Direct beach access, plus we have tennis courts, a fitness center, and partnerships with water sports clubs."],
        ["lead", "That sounds ideal! How's the running and cycling scene around here?"],
        ["agent", "Excellent! Beautiful coastal running paths, dedicated bike lanes, and several cycling groups that meet regularly."],
        ["lead", "This could be exactly what I'm looking for. Can we do a tour that includes the sports facilities?"],
        ["agent", "Absolutely! Let me arrange an active lifestyle tour with our sports amenities specialist - https://calendly.com/sportlife-active-sales CALENDAR"]
      ]
    },

    {
      id: "quiet-professional",
      scenario: "Quiet professional · Home office · Parking concerns",
      messages: [
        ["agent", "Hi Jonathan! I saw your inquiry about our quiet 2-bedroom units. Working from home?"],
        ["lead", "Yes, I need a dedicated home office space and quiet environment for video calls."],
        ["agent", "Perfect! Our units include a separate study room with soundproofing and dedicated fiber internet."],
        ["lead", "That sounds ideal. What about parking? I have a company car I need to keep secure."],
        ["agent", "Each unit comes with a private covered parking spot in our secure underground garage."],
        ["lead", "Great. Is the building generally quiet during work hours?"],
        ["agent", "Absolutely! Most residents are professionals, and we have noise regulations during business hours."],
        ["lead", "This sounds like exactly what I'm looking for. Can we schedule a tour?"],
        ["agent", "Perfect! Let's set up a visit during work hours so you can experience the quiet atmosphere - https://calendly.com/marina-professional-sales CALENDAR"]
      ]
    },

    {
      id: "downsizing-couple",
      scenario: "Empty nesters · Downsizing · Low maintenance",
      messages: [
        ["lead", "Hi, we're empty nesters looking to downsize from our large house. Do you have something smaller but elegant?"],
        ["agent", "Hi Linda! Michal from Serenity Gardens. We specialize in elegant 2-3 bedroom units perfect for couples like yourselves."],
        ["lead", "We're tired of maintaining a big house. What maintenance services do you offer?"],
        ["agent", "Our building includes full maintenance services - gardening, cleaning of common areas, and 24/7 concierge."],
        ["lead", "That sounds wonderful. Is it a quiet, mature community?"],
        ["agent", "Yes! Most residents are 50+ couples and professionals. Very peaceful and well-maintained."],
        ["lead", "Do you have any units with nice views? We love watching sunsets."],
        ["agent", "We have west-facing units with beautiful sunset views from large balconies - perfect for evening wine!"],
        ["lead", "That sounds perfect for us. When can we visit?"],
        ["agent", "I'd love to show you our sunset units! Let's schedule for late afternoon so you can see the views - https://calendly.com/serenity-gardens-sales CALENDAR"]
      ]
    }
  ]
}; 