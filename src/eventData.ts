export interface EventData {
  eventCode: string;
  eventName: string;
  location: string;
  timestamp: number;
  hostName: string;
  attendeeCount: number;
  isActive: boolean;
  description: string;
  fullLocation: string;
  date: string;
  time: string;
  category: string;
  coverImage?: string;
}

export const touchBaseEvent: EventData = {
  eventCode: "ETHSAFARI2025-BASE-TOUCHBASE",
  eventName: "Side Event: Touch Base @EthSafari 2025",
  location: "Kilifi Bay Beach Resort",
  fullLocation: "Bofa Rd, Mnarani, Kilifi, North, Kenya",
  timestamp: Math.floor(new Date("2025-09-12T18:00:00+03:00").getTime() / 1000), // September 12, 2025 6:00 PM GMT+3
  hostName: "Eddie Kago",
  attendeeCount: 100,
  isActive: true,
  description: "Come learn how Base is supporting Onchain builders to unlock value in the digital economy. This event is targeted to active builders; Founders, Investors, Cracked Hackers, and Ecosystem Builders to connect over dinner with the Base team in Kilifi.",
  date: "Friday, September 12",
  time: "6:00 PM - 11:00 PM GMT+3",
  category: "Crypto"
};
