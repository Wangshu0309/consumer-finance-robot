"""Generate a paragraph-style investment analysis from prediction results."""

from typing import Dict, List


def generate_analysis(
    stock_name: str,
    prob: float,
    warnings: List[str],
    features: Dict[str, float],
) -> str:
    """Produce a coherent Chinese investment analysis paragraph."""
    if prob is None:
        return "历史财务数据不足，暂无法生成投资分析。建议跟踪至少两个完整财年后再次查询。"

    pct = prob * 100
    parts = []

    # --- Opening: probability interpretation ---
    if pct >= 65:
        parts.append(
            f"综合评估显示，{stock_name}下一财年归母净利润同比增长的概率为{pct:.1f}%，"
            f"处于较高景气区间。从核心财务指标来看，公司展现出较强的盈利韧性。"
        )
    elif pct >= 40:
        parts.append(
            f"综合评估显示，{stock_name}下一财年归母净利润同比增长的概率为{pct:.1f}%，"
            f"处于中性偏谨慎区间。公司基本面存在结构性分化，需结合具体指标审慎判断。"
        )
    else:
        parts.append(
            f"综合评估显示，{stock_name}下一财年归母净利润同比增长的概率仅为{pct:.1f}%，"
            f"处于较低景气区间。多项指标提示公司面临一定的经营压力，建议投资者保持警惕。"
        )

    # --- Revenue analysis ---
    rev_growth = features.get("revenue_growth_yoy", 0) or 0
    if rev_growth > 0.15:
        parts.append(
            f"营收端表现强劲，同比增长{rev_growth*100:.1f}%，"
            f"表明公司主业处于快速扩张通道。"
        )
    elif rev_growth > 0:
        parts.append(
            f"营收端录得{rev_growth*100:.1f}%的同比增幅，维持温和增长态势。"
        )
    elif rev_growth > -0.10:
        parts.append(
            f"营收同比下滑{abs(rev_growth)*100:.1f}%，增速有所放缓，"
            f"需关注下游需求是否出现趋势性走弱。"
        )
    else:
        parts.append(
            f"营收端出现显著收缩，同比降幅达{abs(rev_growth)*100:.1f}%，"
            f"公司主业面临较大挑战，建议深入分析行业景气度与竞争格局变化。"
        )

    # --- Gross margin ---
    gm_change = features.get("gross_margin_change", 0) or 0
    if gm_change > 0.03:
        parts.append(
            f"毛利率同比提升{gm_change*100:.1f}个百分点，"
            f"反映出公司在成本管控或产品结构升级方面取得了积极成效。"
        )
    elif gm_change > 0:
        parts.append(
            f"毛利率同比小幅提升{gm_change*100:.1f}个百分点，盈利能力基本稳定。"
        )
    elif gm_change > -0.03:
        parts.append(
            f"毛利率同比微降{abs(gm_change)*100:.1f}个百分点，盈利能力略有承压但幅度可控。"
        )
    else:
        parts.append(
            f"毛利率同比下滑{abs(gm_change)*100:.1f}个百分点，"
            f"成本端压力或产品定价权削弱值得重点关注。"
        )

    # --- Cash flow quality ---
    cf_ratio = features.get("net_cash_ratio", 1.0) or 1.0
    if cf_ratio > 1.5:
        parts.append(
            f"净现比高达{cf_ratio:.2f}，经营性现金流显著高于账面利润，"
            f"利润含金量充足，盈利质量优异。"
        )
    elif cf_ratio >= 1.0:
        parts.append(
            f"净现比为{cf_ratio:.2f}，经营性现金流能够覆盖净利润，"
            f"利润质量处于合理水平。"
        )
    elif cf_ratio >= 0.5:
        parts.append(
            f"净现比仅为{cf_ratio:.2f}，经营性现金流不足以支撑账面利润，"
            f"可能存在应收账款增长过快或利润含金量不足的情况。"
        )
    else:
        parts.append(
            f"净现比低至{cf_ratio:.2f}，经营性现金流严重滞后于利润，"
            f"这是财务粉饰的常见信号，建议仔细核查现金流量表。"
        )

    # --- Channel health ---
    inv_change = features.get("inventory_turnover_days_change", 0) or 0
    ar_change = features.get("ar_turnover_days_change", 0) or 0
    se_ratio = features.get("selling_expense_ratio", 0) or 0

    channel_parts = []
    if inv_change > 0.15:
        channel_parts.append(f"存货周转天数同比恶化{inv_change*100:.0f}%")
    elif inv_change < -0.10:
        channel_parts.append(f"存货周转效率同比改善{abs(inv_change)*100:.0f}%")
    if ar_change > 0.15:
        channel_parts.append(f"应收账款周转天数同比恶化{ar_change*100:.0f}%")
    elif ar_change < -0.10:
        channel_parts.append(f"应收账款回款效率同比提升{abs(ar_change)*100:.0f}%")

    if channel_parts:
        parts.append("渠道层面，" + "，".join(channel_parts) + "。")

    # --- Warnings synthesis ---
    if warnings:
        has_revenue_risk = any("收入真实性" in w for w in warnings)
        has_channel_risk = any("渠道健康度" in w for w in warnings)
        has_cash_risk = any("利润含金量" in w for w in warnings)

        risk_items = []
        if has_revenue_risk:
            risk_items.append("收入确认存在异常信号，营收增长与营销费用变动不匹配")
        if has_channel_risk:
            risk_items.append("渠道回款或存货周转效率出现明显恶化，可能存在向经销商压货的行为")
        if has_cash_risk:
            risk_items.append("利润的现金实现率不足，账面盈利向现金流的转化存在障碍")

        if risk_items:
            parts.append(
                "⚠️ 风险提示：" + "；".join(risk_items) + "。"
                "建议在投资决策前进一步核查公司年报附注、关联交易及审计意见等详细信息。"
            )
    else:
        parts.append(
            "三项财务审计规则均未触发预警，当前公开财务数据层面未发现显著的异常信号。"
            "但需指出，规则排雷仅覆盖预设的有限维度，不能替代全面的基本面研究。"
        )

    # --- Closing ---
    if pct >= 60:
        parts.append(
            "总体而言，公司财务画像较为健康，核心指标趋势向好。"
            "在大消费行业选股框架下，该标的具备一定的配置价值，"
            "但需持续跟踪宏观消费环境及行业竞争动态。"
        )
    elif pct >= 40:
        parts.append(
            "总体而言，公司基本面呈现分化态势，利好与风险因素并存。"
            "建议投资者结合估值水平、行业比较及自身风险偏好，做出综合判断。"
        )
    else:
        parts.append(
            "总体而言，当前财务数据反映出较大的经营不确定性。"
            "除非公司基本面出现实质性改善，否则建议采取观望策略。"
        )

    # Join with section markers for frontend parsing
    return "## 核心结论\n\n" + parts[0] + "\n\n" + "## 关键指标解读\n\n" + "\n\n".join(parts[1:-1]) + "\n\n" + "## 投资建议\n\n" + parts[-1]


def generate_summary(
    prob: float,
    warnings: list,
    features: Dict[str, float],
) -> Dict[str, any]:
    """Generate a concise summary card: rating, highlights, risks."""
    pct = prob * 100
    n_warnings = len(warnings)

    # Rating
    if n_warnings == 0 and pct >= 60:
        rating, color = "乐观", "green"
    elif n_warnings <= 1 and pct >= 40:
        rating, color = "中性", "amber"
    else:
        rating, color = "谨慎", "red"

    highlights = []
    risks = []

    rg = features.get("revenue_growth_yoy", 0) or 0
    gm = features.get("gross_margin_change", 0) or 0
    cf = features.get("net_cash_ratio", 1.0) or 1.0
    sr = features.get("selling_expense_ratio", 0) or 0
    inv = features.get("inventory_turnover_days_change", 0) or 0
    ar = features.get("ar_turnover_days_change", 0) or 0

    # Revenue
    if rg > 0.15:
        highlights.append(f"营收同比增长{abs(rg)*100:.1f}%，主业扩张动能充足")
    elif rg > 0:
        highlights.append(f"营收同比温和增长{abs(rg)*100:.1f}%")
    elif rg > -0.05:
        risks.append(f"营收基本持平，增速趋缓")
    else:
        risks.append(f"营收同比下滑{abs(rg)*100:.1f}%，需关注需求端变化")

    # Gross margin
    if gm > 0.02:
        highlights.append(f"毛利率同比提升{gm*100:.1f}个百分点，盈利能力增强")
    elif gm < -0.03:
        risks.append(f"毛利率同比下滑{abs(gm)*100:.1f}个百分点，成本或定价压力显现")

    # Cash flow
    if cf > 1.5:
        highlights.append(f"净现比{cf:.2f}，经营现金流充裕，利润含金量高")
    elif cf < 0.5:
        risks.append(f"净现比仅{cf:.2f}，经营性现金流不足，利润质量存疑")

    # Turnover
    if ar < -0.10:
        highlights.append(f"应收账款回款效率同比改善{abs(ar)*100:.0f}%")
    if inv < -0.10:
        highlights.append(f"存货周转效率同比提升{abs(inv)*100:.0f}%")
    if ar > 0.15:
        risks.append(f"应收账款周转天数同比恶化{ar*100:.0f}%，回款压力上升")
    if inv > 0.15:
        risks.append(f"存货周转天数同比恶化{inv*100:.0f}%，库存积压风险")

    # Warnings
    for w in warnings:
        if "收入真实性" in w:
            risks.append("收入确认异常，营收与费用变动严重背离")
        if "利润含金量" in w:
            risks.append("利润缺乏现金流支撑，获现率不足")

    # Ensure at least some content
    if not highlights:
        highlights.append("各项财务指标处于正常波动区间")
    if not risks:
        risks.append("当前规则排雷未触发显著预警信号")

    return {
        "rating": rating,
        "rating_color": color,
        "highlights": highlights[:3],
        "risks": risks[:4],
    }
