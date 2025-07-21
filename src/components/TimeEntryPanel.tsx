import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface TimeEntryPanelProps {
  date: Date;
  onClose: () => void;
  onSave: (data: any) => void;
}

interface TimeEntry {
  id: string;
  project: string;
  projectId: string;
  stage: string;
  stageId: string;
  task: string;
  taskId: string;
  hours: number;
  minutes: number;
}

interface Project {
  id: string;
  name: string;
  status: 'aberto' | 'fechado';
}

interface Stage {
  id: string;
  name: string;
  project_id: string;
}

interface Task {
  id: string;
  name: string;
  stage_id: string;
}

export default function TimeEntryPanel({ date, onClose, onSave }: TimeEntryPanelProps) {
  const [totalHours, setTotalHours] = useState(8);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newEntry, setNewEntry] = useState<Partial<TimeEntry>>({
    project: '',
    projectId: '',
    stage: '',
    stageId: '',
    task: '',
    taskId: '',
    hours: 0,
    minutes: 0,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (newEntry.projectId) {
      loadStages(newEntry.projectId);
    } else {
      setStages([]);
      setTasks([]);
    }
  }, [newEntry.projectId]);

  useEffect(() => {
    if (newEntry.stageId) {
      loadTasks(newEntry.stageId);
    } else {
      setTasks([]);
    }
  }, [newEntry.stageId]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .eq('status', 'aberto')
        .order('name');

      if (error) throw error;
      setProjects((data as Project[]) || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadStages = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('stages')
        .select('id, name, project_id')
        .eq('project_id', projectId)
        .order('name');

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error loading stages:', error);
    }
  };

  const loadTasks = async (stageId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, name, stage_id')
        .eq('stage_id', stageId)
        .order('name');

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const calculateTotalWorked = () => {
    return entries.reduce((total, entry) => {
      return total + entry.hours + (entry.minutes / 60);
    }, 0);
  };

  const addEntry = () => {
    if (!newEntry.project || newEntry.hours === undefined) return;

    const entry: TimeEntry = {
      id: Math.random().toString(36).substr(2, 9),
      project: newEntry.project || '',
      projectId: newEntry.projectId || '',
      stage: newEntry.stage || '',
      stageId: newEntry.stageId || '',
      task: newEntry.task || '',
      taskId: newEntry.taskId || '',
      hours: newEntry.hours || 0,
      minutes: newEntry.minutes || 0,
    };

    setEntries([...entries, entry]);
    setNewEntry({
      project: '',
      projectId: '',
      stage: '',
      stageId: '',
      task: '',
      taskId: '',
      hours: 0,
      minutes: 0,
    });
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const totalWorked = calculateTotalWorked();
  const totalExpected = totalHours + (totalMinutes / 60);
  const difference = totalWorked - totalExpected;

  const handleSave = () => {
    onSave({
      date,
      totalHours: totalWorked,
      entries,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
      <div className="bg-card w-full max-w-lg h-full overflow-y-auto shadow-xl border-l border-border">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Registro de Horas
              </h2>
              <p className="text-sm text-muted-foreground capitalize">
                {formatDate(date)}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Daily Hours Target */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Meta do Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="hours">Horas</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    max="12"
                    value={totalHours}
                    onChange={(e) => setTotalHours(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="minutes">Minutos</Label>
                  <Input
                    id="minutes"
                    type="number"
                    min="0"
                    max="59"
                    value={totalMinutes}
                    onChange={(e) => setTotalMinutes(Number(e.target.value))}
                  />
                </div>
              </div>
              
              {/* Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Meta:</span>
                  <span>{totalExpected.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trabalhado:</span>
                  <span>{totalWorked.toFixed(1)}h</span>
                </div>
                <div className={cn(
                  "flex justify-between font-medium",
                  difference === 0 && "text-success",
                  difference > 0 && "text-primary",
                  difference < 0 && "text-destructive"
                )}>
                  <span>Diferença:</span>
                  <span>{difference > 0 ? '+' : ''}{difference.toFixed(1)}h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add New Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Adicionar Registro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="project">Projeto *</Label>
                <Select
                  value={newEntry.projectId}
                  onValueChange={(value) => {
                    const selectedProject = projects.find(p => p.id === value);
                    setNewEntry({ 
                      ...newEntry, 
                      projectId: value, 
                      project: selectedProject?.name || '',
                      stageId: '',
                      stage: '',
                      taskId: '',
                      task: ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stage">Etapa</Label>
                <Select
                  value={newEntry.stageId}
                  onValueChange={(value) => {
                    const selectedStage = stages.find(s => s.id === value);
                    setNewEntry({ 
                      ...newEntry, 
                      stageId: value, 
                      stage: selectedStage?.name || '',
                      taskId: '',
                      task: ''
                    });
                  }}
                  disabled={!newEntry.projectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task">Tarefa</Label>
                <Select
                  value={newEntry.taskId}
                  onValueChange={(value) => {
                    const selectedTask = tasks.find(t => t.id === value);
                    setNewEntry({ 
                      ...newEntry, 
                      taskId: value, 
                      task: selectedTask?.name || ''
                    });
                  }}
                  disabled={!newEntry.stageId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma tarefa" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="entry-hours">Horas</Label>
                  <Input
                    id="entry-hours"
                    type="number"
                    min="0"
                    value={newEntry.hours || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, hours: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="entry-minutes">Minutos</Label>
                  <Input
                    id="entry-minutes"
                    type="number"
                    min="0"
                    max="59"
                    value={newEntry.minutes || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, minutes: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Button 
                onClick={addEntry} 
                disabled={!newEntry.project}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </CardContent>
          </Card>

          {/* Entry List */}
          {entries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Registros do Dia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {entries.map((entry, index) => (
                  <div key={entry.id}>
                    <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-1 flex-1">
                        <div className="font-medium text-sm">{entry.project}</div>
                        {entry.stage && (
                          <div className="text-xs text-muted-foreground">
                            Etapa: {entry.stage}
                          </div>
                        )}
                        {entry.task && (
                          <div className="text-xs text-muted-foreground">
                            {entry.task}
                          </div>
                        )}
                        <div className="text-sm font-medium text-primary">
                          {entry.hours}h {entry.minutes > 0 && `${entry.minutes}min`}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEntry(entry.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {index < entries.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}