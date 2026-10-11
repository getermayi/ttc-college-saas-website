"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function LeadsTrendChart({ data }: { data: { date: string; label: string; leads: number }[] }) {
  const total = data.reduce((a, d) => a + d.leads, 0);
  return (
    <figure>
      <div className="h-56 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
                color: "var(--foreground)",
              }}
              labelStyle={{ color: "var(--muted-foreground)" }}
              formatter={(v) => [String(v), "Leads"]}
            />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#leadsFill)"
              activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        Daily leads over the last {data.length} days, {total} in total.
      </figcaption>
      <details className="text-muted-foreground mt-2 text-xs">
        <summary className="cursor-pointer">Show as table</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr>
              <th scope="col" className="text-left font-semibold">
                Date
              </th>
              <th scope="col" className="text-right font-semibold">
                Leads
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date}>
                <td>{d.label}</td>
                <td className="text-right tabular-nums">{d.leads}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
