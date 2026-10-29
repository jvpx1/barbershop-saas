const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_HEIGHT = 48;

function getPositionAndHeight(startsAt, durationMinutes) {
  const date = new Date(startsAt);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  const minutesFromStart = (hours - START_HOUR) * 60 + minutes;
  const pixelsPerMinute = SLOT_HEIGHT / 30;
  
  return {
    top: minutesFromStart * pixelsPerMinute,
    height: Math.max(durationMinutes * pixelsPerMinute, 34), 
  };
}

export default function DailyGrid({ appointments, barbers, onSelectAppointment }) {
  const activeBarbers = barbers.filter(b => b.active || appointments.some(a => a.barber.id === b.id));

  const timeSlots = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    timeSlots.push(`${String(h).padStart(2, "0")}:00`);
    timeSlots.push(`${String(h).padStart(2, "0")}:30`);
  }

  return (
    <div className="overflow-x-auto bg-[#15171C]">
      <div className="min-w-[600px]">
        <div className="flex border-b border-white/[0.06]">
          <div className="w-16 shrink-0 border-r border-white/[0.06]" />
          <div className="flex flex-1">
            {activeBarbers.map((barber) => (
              <div key={barber.id} className="flex-1 border-r border-white/[0.06] p-4 text-center">
                <p className="text-sm font-semibold text-white">{barber.name}</p>
                <p className="text-[11px] text-slate-500">Barbeiro</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex">
          <div className="w-16 shrink-0 border-r border-white/[0.06]">
            {timeSlots.map((time) => (
              <div key={time} className="flex justify-end pr-2 text-[11px] text-slate-500" style={{ height: SLOT_HEIGHT }}>
                <span className="-mt-2">{time}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-1 relative">
            <div className="absolute inset-0 flex flex-col">
              {timeSlots.map((time, i) => (
                <div key={time} className={`border-b border-white/[0.03] ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`} style={{ height: SLOT_HEIGHT }} />
              ))}
            </div>

            {activeBarbers.map((barber) => {
              const barberAppointments = appointments.filter(a => a.barber.id === barber.id);
              
              return (
                <div key={barber.id} className="relative flex-1 border-r border-white/[0.06]">
                  {barberAppointments.map((apt) => {
                    const { top, height } = getPositionAndHeight(apt.startsAt, apt.service.durationMinutes);
                    
                    return (
                      <div
                        key={apt.id}
                        onClick={() => onSelectAppointment(apt)}
                        className="absolute left-1 right-1 z-10 cursor-pointer overflow-hidden rounded-md border border-amber-400/30 bg-amber-400/10 p-2 transition hover:border-amber-400/60 hover:bg-amber-400/20 shadow-lg flex flex-col justify-center"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <p className="truncate text-xs font-semibold text-amber-300 leading-tight">{apt.customerName}</p>
                        
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}