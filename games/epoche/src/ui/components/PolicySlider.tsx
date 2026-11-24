import { LandChoice } from "./DecisionScenes";
import { useEffect, useId, useState } from "react";
import type { PolicyPreview } from "@engine/systems/policies";
import type { PolicySnapshot } from "@worker/protocol";
import { translate, type Language } from "../../i18n";
import { formatNumber } from "../format";
import { useGameStore } from "../store/gameStore";
import { policySymbols, subjectSymbols } from "../symbols";

export function PolicySlider({
  policy,
  language,
}: {
  policy: PolicySnapshot;
  language: Language;
}) {
  const id = useId();
  const t = (key: string) => translate(language, key);
  const setPolicy = useGameStore((state) => state.setPolicy);
  const previewPolicy = useGameStore((state) => state.previewPolicy);
  const influence = useGameStore((state) => state.snapshot?.influence ?? 0);
  const queuedValue = useGameStore(
    (state) => state.snapshot?.queuedValues?.[policy.id],
  );
  const pending =
    useGameStore((state) => Object.hasOwn(state.pending, policy.id)) ||
    queuedValue !== undefined;
  const rejection = useGameStore((state) =>
    state.lastResult?.policyId === policy.id ? state.lastResult.result : null,
  );
  const [draft, setDraft] = useState<number | null>(null);
  const [sent, setSent] = useState<number | null>(null);
  const [preview, setPreview] = useState<{
    value: number;
    target: number;
    data: PolicyPreview | null;
  } | null>(null);
  const value = pending
    ? (queuedValue ?? sent ?? policy.target)
    : (draft ?? policy.target);
  const editing = !pending && value !== policy.target;
  const options = [
    t(policy.leftLabelKey),
    t("edit.balance"),
    t(policy.rightLabelKey),
  ];
  const [left, right] = policySymbols[policy.id] ?? ["◀", "▶"];
  const choice = options[value < 50 ? 0 : value > 50 ? 2 : 1];
  useEffect(() => {
    if (!editing) return;
    let current = true;
    void previewPolicy(policy.id, value).then((data) => {
      if (current) setPreview({ value, target: policy.target, data });
    });
    return () => {
      current = false;
    };
  }, [
    editing,
    value,
    policy.id,
    policy.target,
    policy.effective,
    previewPolicy,
  ]);
  const data =
    preview?.value === value && preview.target === policy.target
      ? preview.data
      : null;
  const affordable = data !== null && influence >= data.cost;
  return (
    <article
      className="policy decision-policy"
      data-policy={policy.id}
      data-target={policy.target}
      data-effective={policy.effective}
    >
      <small className="policy-topic">{t(policy.nameKey)}</small>
      <label className="policy-name" htmlFor={id}>
        {t("ask." + policy.id)}
      </label>
      <div className="policy-presets">
        {options.map((label, index) => (
          <button
            type="button"
            key={index}
            disabled={pending}
            aria-pressed={value === index * 50}
            onClick={() => setDraft(index * 50)}
          >
            {policy.id === "fields" && index !== 1 ? (
              <LandChoice forest={index === 0} />
            ) : (
              <span aria-hidden="true">{[left, "⚖️", right][index]}</span>
            )}
            {label}
          </button>
        ))}
      </div>
      <div className="slider-wrap">
        <div className="slider-track" aria-hidden="true">
          <span style={{ width: value + "%" }} />
        </div>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={value}
          disabled={pending}
          aria-valuetext={choice + " · " + value + "/100"}
          onChange={(e) => setDraft(e.currentTarget.valueAsNumber)}
        />
        <span
          className="effective-marker"
          aria-hidden="true"
          style={{ left: policy.effective + "%" }}
        />
      </div>
      <div className="chosen-position">
        <span>{choice}</span>
        <output htmlFor={id}>{value}/100</output>
      </div>
      <p className="setting-caption">
        {pending
          ? translate(language, "edit.waiting", { value })
          : t(editing ? "edit.preview" : "edit.chosen")}
        {Math.abs(value - policy.effective) > 0.01 &&
          " · " +
            translate(language, "edit.current", {
              value: formatNumber(policy.effective, language, 1),
            })}
      </p>
      {editing && (
        <div className="policy-confirm">
          {data ? (
            <>
              <small>{t("edit.effects")}</small>
              <div className="impact-list" aria-label={t("edit.effects")}>
                {data.effects
                  .filter((e) => Math.abs(e.deltaTarget) > 0.0001)
                  .map((e) => (
                    <span key={e.attribute}>
                      <i aria-hidden="true">{subjectSymbols[e.attribute]}</i>
                      {t(
                        "impact." +
                          e.attribute +
                          (e.deltaTarget > 0 ? ".more" : ".less"),
                      )}
                    </span>
                  ))}
              </div>
              <small>
                {translate(language, "edit.timing", {
                  delay: formatNumber(data.delayYears, language, 2),
                  ramp: formatNumber(data.rampYears, language, 2),
                })}
              </small>
              <details className="precise-effects">
                <summary>{t("edit.precise")}</summary>
                {data.effects
                  .filter((e) => Math.abs(e.deltaTarget) > 0.0001)
                  .map((e) => (
                    <div key={e.attribute}>
                      {t("attribute." + e.attribute)} ·{" "}
                      {formatNumber(e.deltaTarget, language, 2, true)}
                    </div>
                  ))}
              </details>
              {!affordable && (
                <small>
                  {translate(language, "edit.short", {
                    value: formatNumber(influence, language, 2),
                  })}
                </small>
              )}
            </>
          ) : (
            <small>{t("policy.previewLoading")}</small>
          )}
          <div className="choice-actions">
            <button
              type="button"
              disabled={!affordable}
              onClick={() => {
                if (affordable) {
                  setSent(value);
                  setPolicy(policy.id, value);
                  setDraft(null);
                }
              }}
            >
              {t("edit.confirm")}
              {data &&
                " · " +
                  translate(language, "policy.cost", {
                    amount: formatNumber(data.cost, language, 2),
                  })}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setDraft(null)}
            >
              {t("edit.cancel")}
            </button>
          </div>
        </div>
      )}
      {!pending &&
        rejection?.ok === false &&
        rejection.reason === "insufficient_influence" && (
          <p role="status">
            {translate(language, "policy.costRejected", {
              cost: formatNumber(rejection.cost, language, 2),
              available: formatNumber(rejection.available, language, 2),
            })}
          </p>
        )}
    </article>
  );
}
