"use client";

import { useState } from "react";
import { GuardianGate } from "@/components/GuardianGate";

export function GoodsBuyPanel({ goodsName }: { goodsName: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="goods-buy">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          setStatus(null);
          setOpen(true);
        }}
      >
        구매 알아보기
      </button>
      {status ? (
        <p className="status-box status-box-info tiny" role="status">
          {status}
        </p>
      ) : null}

      <GuardianGate
        open={open}
        title={`${goodsName} · 보호자 확인`}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          setStatus(
            "결제가 연결되어 있지 않아요. 재고·계정·결제 수단이 준비되면 여기서 이어져요. 지금은 결제가 되지 않았고, 「결제 완료」도 아닙니다.",
          );
        }}
        confirmLabel="보호자 확인 · 상태 보기"
      >
        <p>
          아이 혼자 결제하지 않도록, 보호자가 확인한 뒤에만 다음으로 가요.
        </p>
        <p className="muted tiny">
          아직 결제·재고·계정이 없어요. 확인 후에도 가짜 결제 성공은 표시하지
          않아요.
        </p>
      </GuardianGate>
    </div>
  );
}
