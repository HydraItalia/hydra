interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  features: string[];
}

export function FeatureCard({
  icon,
  title,
  description,
  features,
}: FeatureCardProps) {
  return (
    <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-200 dark:border-slate-700 hover:scale-105">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <span className="text-green-500">✓</span> {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
