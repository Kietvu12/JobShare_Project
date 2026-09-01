import { commissionTierLabelFontClass } from '../../utils/jobCommissionUi';

/**
 * Banner phí job — admin (raw %) vs CTV (ước tính tiền).
 * CTV nhiều điều kiện: xếp dọc (nhãn full-width) thay vì 3 cột chật.
 */
export default function JobCommissionBanner({
  bannerLabel,
  tiers = [],
  fallbackAmount = '',
  useAdminAPI = false,
  useCollapsedCommissionBanner = false,
  isInCampaign = false,
}) {
  const rows = Array.isArray(tiers) ? tiers.filter((t) => t?.amount) : [];
  const hasRows = rows.length > 0;
  const displayAmount = rows[0]?.amount || fallbackAmount;

  if (!hasRows && !fallbackAmount) return null;

  const bannerBg = useAdminAPI ? '#5F5F5F' : '#4b4f5a';
  const tierLabelBg = useAdminAPI && isInCampaign ? '#e5f0fb' : '#EB9696';
  const tierLabelColor = useAdminAPI && isInCampaign ? '#0d6bbd' : '#ffffff';
  const amountBg = '#DF2020';

  /** CTV + nhiều tier: header trên, từng điều kiện xếp dọc */
  const useStackedCtvLayout = !useAdminAPI && !useCollapsedCommissionBanner && rows.length > 1;

  if (useStackedCtvLayout) {
    return (
      <div
        className="flex flex-col rounded-md overflow-hidden shadow-sm border"
        style={{ borderColor: '#7c3aed' }}
      >
        <div
          className="px-2 py-2 text-[10px] sm:text-[11px] font-medium leading-snug text-left"
          style={{ backgroundColor: bannerBg, color: '#ffffff' }}
        >
          {bannerLabel}
        </div>
        {rows.map((tier, index) => (
          <div
            key={index}
            className="flex flex-col"
            style={{ borderTop: index === 0 ? 'none' : '1px solid #d1d5db' }}
          >
            {tier.label ? (
              <div
                className="px-2 py-1.5 text-[10px] sm:text-[11px] font-medium leading-snug text-left"
                style={{ backgroundColor: '#fce7e7', color: '#7f1d1d' }}
                title={tier.label}
              >
                <span className="line-clamp-3">{tier.label}</span>
              </div>
            ) : null}
            <div
              className="px-2 py-2 text-[11px] sm:text-[12px] font-bold leading-snug text-left break-words"
              style={{ backgroundColor: amountBg, color: '#ffffff' }}
              title={tier.amount}
            >
              {tier.amount}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex items-stretch rounded-md overflow-hidden shadow-sm border"
      style={{ borderColor: '#7c3aed' }}
    >
      <div
        className="flex-[0_0_32%] sm:flex-[0_0_35%] min-w-0 px-1.5 sm:px-2 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-medium flex items-center justify-start text-left leading-snug whitespace-normal self-stretch"
        style={{ backgroundColor: bannerBg, color: '#ffffff' }}
      >
        <span className="line-clamp-3">{bannerLabel}</span>
      </div>

      {useCollapsedCommissionBanner && hasRows ? (
        <div
          className="flex-1 min-w-0 px-2 py-1.5 sm:py-2 text-[10px] sm:text-[12px] font-bold flex items-center justify-start text-left leading-snug self-stretch break-words"
          style={{ backgroundColor: amountBg, color: '#ffffff' }}
          title={displayAmount}
        >
          {displayAmount}
        </div>
      ) : hasRows ? (
        <div className="flex-1 min-w-0 flex flex-col self-stretch">
          {rows.map((tier, index) => (
            <div
              key={index}
              className="flex flex-1 min-h-[36px] items-stretch"
              style={{ borderTop: index === 0 ? 'none' : '1px solid #9ca3af' }}
            >
              {tier.label ? (
                <div
                  className="w-[38%] sm:w-[42%] min-w-0 flex-shrink-0 px-1.5 sm:px-2 py-1.5 sm:py-2 font-semibold flex items-center justify-start text-left self-stretch"
                  style={{ backgroundColor: tierLabelBg, color: tierLabelColor }}
                >
                  <span
                    className={`break-words whitespace-normal leading-snug ${commissionTierLabelFontClass(tier.label)}`}
                    title={tier.label}
                  >
                    {tier.label}
                  </span>
                </div>
              ) : null}
              <div
                className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-[12px] font-bold flex items-center justify-start text-left leading-snug self-stretch break-words"
                style={{ backgroundColor: amountBg, color: '#ffffff' }}
                title={tier.amount}
              >
                {tier.amount}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex-1 min-w-0 px-2 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold flex items-center justify-start text-left break-words self-stretch"
          style={{ backgroundColor: amountBg, color: '#ffffff' }}
          title={fallbackAmount}
        >
          {fallbackAmount}
        </div>
      )}
    </div>
  );
}
