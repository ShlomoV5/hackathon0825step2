import CallActions from './CallActions';

export default function FloatingCallBox() {
  return (
    <div className="floating-box right">
      <div style={{marginBottom: 8, fontWeight: 700}}>שיחה מהירה</div>
      <CallActions />
    </div>
  );
}
