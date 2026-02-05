import { MarketDetail } from "@/components/market-detail";

export default async function MarketPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <MarketDetail marketId={id} />;
}


