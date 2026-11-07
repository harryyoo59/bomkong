import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { GoodsBuyPanel } from "@/components/GoodsBuyPanel";

const GOODS = [
  { id: "doll", name: "봄이콩이 인형", note: "캐릭터 인형" },
  { id: "tee", name: "로고 티셔츠", note: "공식 로고 부착" },
  { id: "bag", name: "가방", note: "로고·캐릭터" },
  { id: "hat", name: "모자 / 비니", note: "로고 부착" },
  { id: "socks", name: "양말", note: "캐릭터 굿즈" },
  { id: "sticker", name: "스티커", note: "로고·얼굴" },
] as const;

export default function GoodsPage() {
  return (
    <SiteShell title="상품">
      <section className="panel stub-card">
        <p className="eyebrow">캐릭터 상품</p>
        <h1 className="section-title">봄이콩이 굿즈</h1>
        <p className="muted">
          인형·옷·가방 등 캐릭터 상품 자리예요. 결제·재고·계정은 아직 없어서
          지금은 상태만 보여 줘요. 가짜로 「결제 완료」라고 하지 않아요.
        </p>
      </section>

      <ul className="goods-list">
        {GOODS.map((item) => (
          <li key={item.id} className="panel goods-item">
            <div>
              <h2 className="goods-name">{item.name}</h2>
              <p className="muted tiny">{item.note}</p>
            </div>
            <GoodsBuyPanel goodsName={item.name} />
          </li>
        ))}
      </ul>

      <Link className="btn btn-soft btn-wide" href="/">
        거실로 돌아가기
      </Link>
    </SiteShell>
  );
}
