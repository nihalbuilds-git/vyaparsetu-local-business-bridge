import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface FestivalTemplate {
  id: string;
  name: string;
  nameHi: string;
  emoji: string;
  offer: string;
  offerHi: string;
  campaignType: string;
  color: string;
}

const festivalTemplates: FestivalTemplate[] = [
  {
    id: "diwali",
    name: "Diwali Sale",
    nameHi: "दिवाली सेल",
    emoji: "🪔",
    offer: "Grand Diwali Sale! Up to 50% OFF on all items. Light up your savings this festive season! Limited period offer.",
    offerHi: "भव्य दिवाली सेल! सभी वस्तुओं पर 50% तक की छूट। इस त्योहारी सीजन में अपनी बचत को रोशन करें!",
    campaignType: "Festival Sale",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "holi",
    name: "Holi Dhamaka",
    nameHi: "होली धमाका",
    emoji: "🎨",
    offer: "Holi Dhamaka Offer! Flat 30% OFF on all products. Add colors to your shopping! Celebrate with amazing deals.",
    offerHi: "होली धमाका ऑफर! सभी प्रोडक्ट्स पर फ्लैट 30% छूट। अपनी शॉपिंग में रंग भरें!",
    campaignType: "Festival Sale",
    color: "from-pink-500 to-purple-600",
  },
  {
    id: "eid",
    name: "Eid Special",
    nameHi: "ईद स्पेशल",
    emoji: "🌙",
    offer: "Eid Mubarak Special Sale! Exclusive discounts up to 40% on premium collection. Share the joy of Eid with great offers!",
    offerHi: "ईद मुबारक स्पेशल सेल! प्रीमियम कलेक्शन पर 40% तक की विशेष छूट। ईद की खुशी शेयर करें!",
    campaignType: "Festival Sale",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "navratri",
    name: "Navratri Offer",
    nameHi: "नवरात्रि ऑफर",
    emoji: "🙏",
    offer: "Navratri Special! 9 days of amazing offers. Buy 2 Get 1 Free on selected items. Celebrate the divine festival with savings!",
    offerHi: "नवरात्रि स्पेशल! 9 दिन के शानदार ऑफर। चुनिंदा वस्तुओं पर 2 खरीदें 1 फ्री। बचत के साथ त्योहार मनाएं!",
    campaignType: "Festival Sale",
    color: "from-red-500 to-rose-600",
  },
  {
    id: "raksha-bandhan",
    name: "Raksha Bandhan",
    nameHi: "रक्षा बंधन",
    emoji: "🎁",
    offer: "Raksha Bandhan Special! Gift your sibling the best. 25% OFF on gift items & combos. Celebrate the bond of love!",
    offerHi: "रक्षा बंधन स्पेशल! अपने भाई-बहन को दें सबसे अच्छा तोहफा। गिफ्ट आइटम्स पर 25% छूट!",
    campaignType: "Festival Sale",
    color: "from-violet-500 to-indigo-600",
  },
  {
    id: "independence-day",
    name: "Independence Day",
    nameHi: "स्वतंत्रता दिवस",
    emoji: "🇮🇳",
    offer: "Independence Day Freedom Sale! Flat 15% OFF storewide. Celebrate India's pride with unbeatable prices!",
    offerHi: "स्वतंत्रता दिवस फ्रीडम सेल! पूरी दुकान पर फ्लैट 15% छूट। भारत के गौरव का जश्न मनाएं!",
    campaignType: "Festival Sale",
    color: "from-orange-500 to-green-600",
  },
  {
    id: "christmas",
    name: "Christmas Sale",
    nameHi: "क्रिसमस सेल",
    emoji: "🎄",
    offer: "Merry Christmas Sale! Up to 35% OFF on winter collection & gifts. Ho Ho Ho - Santa's deals are here!",
    offerHi: "मेरी क्रिसमस सेल! विंटर कलेक्शन और गिफ्ट्स पर 35% तक की छूट। सांता के ऑफर आ गए!",
    campaignType: "Festival Sale",
    color: "from-red-600 to-green-600",
  },
  {
    id: "makar-sankranti",
    name: "Makar Sankranti",
    nameHi: "मकर संक्रांति",
    emoji: "🪁",
    offer: "Makar Sankranti Special! Fly high with our offers. 20% OFF on all items. Sweet deals for a sweet festival!",
    offerHi: "मकर संक्रांति स्पेशल! हमारे ऑफर्स के साथ ऊंची उड़ान भरें। सभी वस्तुओं पर 20% छूट!",
    campaignType: "Festival Sale",
    color: "from-sky-500 to-blue-600",
  },
];

interface FestivalTemplatesProps {
  lang: string;
  onSelect: (offer: string, campaignType: string) => void;
}

export default function FestivalTemplates({ lang, onSelect }: FestivalTemplatesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        <h3 className="text-sm font-bold font-display text-foreground">
          {lang === "hi" ? "🎉 त्योहार टेम्पलेट — एक क्लिक में" : "🎉 Festival Templates — One Click"}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {festivalTemplates.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(lang === "hi" ? t.offerHi : t.offer, t.campaignType)}
            className="group relative overflow-hidden rounded-xl border border-border/40 p-3 text-left transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity`} />
            <div className="relative">
              <span className="text-xl">{t.emoji}</span>
              <p className="text-xs font-bold mt-1 text-foreground">
                {lang === "hi" ? t.nameHi : t.name}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
