import './SidebarSection.css';

type SidebarSectionProps = {
  label: string;
};

export function SidebarSection({ label }: SidebarSectionProps) {
  return (
    <div className="sidebar-section">
      <span className="sidebar-section__label">{label}</span>
    </div>
  );
}
