import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import TimeEntryPanel from '@/components/TimeEntryPanel';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeEntries, setTimeEntries] = useState<Record<string, any>>({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Create calendar grid
  const calendarDays = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(year, month + (direction === 'next' ? 1 : -1), 1));
  };

  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);
  };

  const getDateStatus = (day: number) => {
    const date = new Date(year, month, day);
    const dateKey = getDateKey(date);
    const entry = timeEntries[dateKey];
    
    if (!entry) return 'empty';
    if (entry.totalHours >= 8) return 'complete';
    if (entry.totalHours > 0) return 'partial';
    return 'empty';
  };

  const today = new Date();
  const isToday = (day: number) => {
    return year === today.getFullYear() && 
           month === today.getMonth() && 
           day === today.getDate();
  };

  return (
    <Layout currentPage="dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Controle de ponto e projetos</p>
        </div>

        {/* Calendar Card */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {MONTHS[month]} {year}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="p-1 text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={index} className="p-1 h-8"></div>;
                }

                const status = getDateStatus(day);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "p-1 h-8 rounded-md text-xs font-medium transition-all hover:scale-105 hover:shadow-md",
                      "border border-transparent flex items-center justify-center relative",
                      isTodayDate && "ring-2 ring-primary ring-offset-1",
                      status === 'complete' && "bg-success text-success-foreground",
                      status === 'partial' && "bg-warning text-warning-foreground",
                      status === 'empty' && "bg-muted text-muted-foreground hover:bg-muted/80",
                      selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year &&
                      "ring-2 ring-accent ring-offset-1"
                    )}
                  >
                    {day}
                    {status !== 'empty' && (
                      <div className={cn(
                        "absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full",
                        status === 'complete' && "bg-success-foreground",
                        status === 'partial' && "bg-warning-foreground"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-success"></div>
                <span className="text-muted-foreground">Completo (8h+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-warning"></div>
                <span className="text-muted-foreground">Parcial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted"></div>
                <span className="text-muted-foreground">Vazio</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Horas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0h</div>
              <p className="text-xs text-muted-foreground">
                de 160h esperadas
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dias Trabalhados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground">
                de {daysInMonth} dias
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projetos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground">
                projetos em andamento
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Time Entry Panel */}
      {selectedDate && (
        <TimeEntryPanel
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onSave={(data) => {
            const dateKey = getDateKey(selectedDate);
            setTimeEntries(prev => ({
              ...prev,
              [dateKey]: data
            }));
            setSelectedDate(null);
          }}
        />
      )}
    </Layout>
  );
}