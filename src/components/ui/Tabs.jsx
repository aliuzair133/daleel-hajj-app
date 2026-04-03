export function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={['flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1', className].join(' ')}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl',
            'text-sm font-semibold transition-all duration-150 min-h-0',
            active === tab.id
              ? 'bg-white dark:bg-gray-700 text-[#0D7377] shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
          ].join(' ')}
        >
          {tab.icon && <tab.icon size={15} />}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
