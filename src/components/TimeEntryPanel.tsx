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
  existingData?: any;
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
  percentage: number;
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

export default function TimeEntryPanel({ date, onClose, onSave, existingData }: TimeEntryPanelProps) {
  const [totalHours, setTotalHours] = useState(8);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showProjectsArea, setShowProjectsArea] = useState(false);
  const [draftEntries, setDraftEntries] = useState<Partial<TimeEntry>[]>([]);
  const [hasTimePoint, setHasTimePoint] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<TimeEntry>>({
    project: '',
    projectId: '',
    stage: '',
    stageId: '',
    task: '',
    taskId: '',
    hours: 0,
    minutes: 0,
    percentage: 0,
  });

  useEffect(() => {
    loadProjects();
    loadExistingData();
  }, []);

  // Load existing data when component mounts
  const loadExistingData = async () => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      // Load time point for the day
      const { data: timePoint, error: timePointError } = await supabase
        .from('time_points')
        .select('total_minutes')
        .eq('date', dateStr)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
        
      if (timePointError && timePointError.code !== 'PGRST116') {
        throw timePointError;
      }
      
      if (timePoint) {
        const hours = Math.floor(timePoint.total_minutes / 60);
        const minutes = timePoint.total_minutes % 60;
        setTotalHours(hours);
        setTotalMinutes(minutes);
        setHasTimePoint(true);
        setShowProjectsArea(true);
      }
      
      // Load time records for the day
      const { data: records, error: recordsError } = await supabase
        .from('time_records')
        .select(`
          id, minutes, description,
          project_id, stage_id, task_id,
          projects(name),
          stages(name),
          tasks(name)
        `)
        .eq('date', dateStr)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
        
      if (recordsError) throw recordsError;
      
      if (records && records.length > 0) {
        const existingEntries = records.map(record => {
          const hours = Math.floor(record.minutes / 60);
          const minutes = record.minutes % 60;
          const totalDaily = totalHours * 60 + totalMinutes;
          const percentage = totalDaily > 0 ? (record.minutes / totalDaily) * 100 : 0;
          
          return {
            id: record.id,
            project: record.projects?.name || '',
            projectId: record.project_id || '',
            stage: record.stages?.name || '',
            stageId: record.stage_id || '',
            task: record.tasks?.name || '',
            taskId: record.task_id || '',
            hours,
            minutes,
            percentage: Math.round(percentage * 100) / 100
          };
        });
        
        setEntries(existingEntries);
        setShowProjectsArea(true);
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  };

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
    const entriesTotal = entries.reduce((total, entry) => {
      return total + entry.hours + (entry.minutes / 60);
    }, 0);
    
    const draftsTotal = draftEntries.reduce((total, entry) => {
      return total + (entry.hours || 0) + ((entry.minutes || 0) / 60);
    }, 0);
    
    return entriesTotal + draftsTotal;
  };

  const convertHoursToPercentage = (hours: number, minutes: number = 0) => {
    const totalDailyMinutes = totalHours * 60 + totalMinutes;
    if (totalDailyMinutes === 0) return 0;
    const entryMinutes = hours * 60 + minutes;
    return Math.round((entryMinutes / totalDailyMinutes) * 100 * 100) / 100;
  };

  const convertPercentageToHours = (percentage: number) => {
    const totalDailyMinutes = totalHours * 60 + totalMinutes;
    const entryMinutes = Math.round((percentage / 100) * totalDailyMinutes);
    return {
      hours: Math.floor(entryMinutes / 60),
      minutes: entryMinutes % 60
    };
  };

  const validateTotalPercentage = () => {
    const currentTotal = calculateTotalWorked();
    const totalDaily = totalHours + (totalMinutes / 60);
    return currentTotal <= totalDaily;
  };

  const addToDraft = () => {
    if (!newEntry.project || (newEntry.hours === undefined && newEntry.percentage === undefined)) return;
    
    // Validate total doesn't exceed 100%
    const entryHours = (newEntry.hours || 0) + ((newEntry.minutes || 0) / 60);
    const totalWorked = calculateTotalWorked();
    const totalDaily = totalHours + (totalMinutes / 60);
    
    if (totalWorked + entryHours > totalDaily) {
      alert('O total de horas não pode ultrapassar o ponto do dia!');
      return;
    }

    const draftEntry: Partial<TimeEntry> = {
      id: Math.random().toString(36).substr(2, 9),
      project: newEntry.project || '',
      projectId: newEntry.projectId || '',
      stage: newEntry.stage || '',
      stageId: newEntry.stageId || '',
      task: newEntry.task || '',
      taskId: newEntry.taskId || '',
      hours: newEntry.hours || 0,
      minutes: newEntry.minutes || 0,
      percentage: newEntry.percentage || convertHoursToPercentage(newEntry.hours || 0, newEntry.minutes || 0),
    };

    setDraftEntries([...draftEntries, draftEntry]);
    setNewEntry({
      project: '',
      projectId: '',
      stage: '',
      stageId: '',
      task: '',
      taskId: '',
      hours: 0,
      minutes: 0,
      percentage: 0,
    });
  };

  const removeDraftEntry = (id: string) => {
    setDraftEntries(draftEntries.filter(entry => entry.id !== id));
  };

  const addAllDraftEntries = () => {
    const validDrafts = draftEntries.filter(draft => 
      draft.project && (draft.hours || 0) > 0
    ) as TimeEntry[];
    
    setEntries([...entries, ...validDrafts]);
    setDraftEntries([]);
  };

  const addEntry = () => {
    if (!newEntry.project || newEntry.hours === undefined) return;
    
    // Validate total doesn't exceed 100%
    const entryHours = (newEntry.hours || 0) + ((newEntry.minutes || 0) / 60);
    const totalWorked = calculateTotalWorked();
    const totalDaily = totalHours + (totalMinutes / 60);
    
    if (totalWorked + entryHours > totalDaily) {
      alert('O total de horas não pode ultrapassar o ponto do dia!');
      return;
    }

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
      percentage: newEntry.percentage || convertHoursToPercentage(newEntry.hours || 0, newEntry.minutes || 0),
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
      percentage: 0,
    });
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const totalWorked = calculateTotalWorked();
  const totalExpected = totalHours + (totalMinutes / 60);
  const difference = totalWorked - totalExpected;

  const duplicatePreviousRecord = async () => {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;
      
      // Find the most recent day with records
      const { data: previousRecords, error } = await supabase
        .from('time_records')
        .select(`
          minutes, project_id, stage_id, task_id,
          projects(name),
          stages(name),
          tasks(name)
        `)
        .eq('user_id', currentUser.id)
        .lt('date', date.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      if (previousRecords && previousRecords.length > 0) {
        // Group by date to find the latest complete day
        const recordsByDate: Record<string, any[]> = {};
        
        const { data: allPrevious, error: allError } = await supabase
          .from('time_records')
          .select(`
            date, minutes, project_id, stage_id, task_id,
            projects(name),
            stages(name), 
            tasks(name)
          `)
          .eq('user_id', currentUser.id)
          .lt('date', date.toISOString().split('T')[0])
          .order('date', { ascending: false });
          
        if (allError) throw allError;
        
        if (allPrevious && allPrevious.length > 0) {
          allPrevious.forEach(record => {
            if (!recordsByDate[record.date]) {
              recordsByDate[record.date] = [];
            }
            recordsByDate[record.date].push(record);
          });
          
          // Get the latest date with records
          const latestDate = Object.keys(recordsByDate)[0];
          const latestRecords = recordsByDate[latestDate];
          
          // Convert to draft entries
          const duplicatedEntries = latestRecords.map(record => {
            const hours = Math.floor(record.minutes / 60);
            const minutes = record.minutes % 60;
            const percentage = convertHoursToPercentage(hours, minutes);
            
            return {
              id: Math.random().toString(36).substr(2, 9),
              project: record.projects?.name || '',
              projectId: record.project_id || '',
              stage: record.stages?.name || '',
              stageId: record.stage_id || '',
              task: record.tasks?.name || '',
              taskId: record.task_id || '',
              hours,
              minutes,
              percentage
            };
          });
          
          setDraftEntries(duplicatedEntries);
          setShowProjectsArea(true);
        }
      }
    } catch (error) {
      console.error('Error duplicating previous record:', error);
    }
  };

  const handleSave = async () => {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;
      
      const dateStr = date.toISOString().split('T')[0];
      
      // Save time point
      const totalMinutesWorked = Math.round(totalWorked * 60);
      
      const { error: timePointError } = await supabase
        .from('time_points')
        .upsert({
          user_id: currentUser.id,
          date: dateStr,
          total_minutes: totalHours * 60 + totalMinutes
        }, {
          onConflict: 'user_id,date'
        });
        
      if (timePointError) throw timePointError;
      
      // Delete existing records for this date
      const { error: deleteError } = await supabase
        .from('time_records')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('date', dateStr);
        
      if (deleteError) throw deleteError;
      
      // Insert new records
      if (entries.length > 0) {
        const recordsToInsert = entries.map(entry => ({
          user_id: currentUser.id,
          date: dateStr,
          minutes: entry.hours * 60 + entry.minutes,
          project_id: entry.projectId || null,
          stage_id: entry.stageId || null,
          task_id: entry.taskId || null,
          description: null
        }));
        
        const { error: insertError } = await supabase
          .from('time_records')
          .insert(recordsToInsert);
          
        if (insertError) throw insertError;
      }
      
      onSave({
        date,
        totalHours: totalWorked,
        entries,
      });
      
    } catch (error) {
      console.error('Error saving time entries:', error);
    }
  };

  const handleTimePointChange = async () => {
    setHasTimePoint(true);
  };

  const handleSaveTimePoint = async () => {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;
      
      const dateStr = date.toISOString().split('T')[0];
      
      // Save time point
      const { error: timePointError } = await supabase
        .from('time_points')
        .upsert({
          user_id: currentUser.id,
          date: dateStr,
          total_minutes: totalHours * 60 + totalMinutes
        }, {
          onConflict: 'user_id,date'
        });
        
      if (timePointError) throw timePointError;
      
      setShowProjectsArea(true);
    } catch (error) {
      console.error('Error saving time point:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl border border-border rounded-lg">
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

          {/* Step 1: Daily Hours Target */}
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
                    onChange={(e) => {
                      setTotalHours(Number(e.target.value));
                      handleTimePointChange();
                    }}
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
                    onChange={(e) => {
                      setTotalMinutes(Number(e.target.value));
                      handleTimePointChange();
                    }}
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
              
              <Button 
                onClick={handleSaveTimePoint}
                className="w-full"
                disabled={totalHours === 0 && totalMinutes === 0}
              >
                Salvar Ponto e Continuar
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Project Area - Only shown after time point is saved */}
          {!showProjectsArea && hasTimePoint && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Projetos do Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    onClick={() => setShowProjectsArea(true)}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Projetos ao Dia
                  </Button>
                  <Button 
                    onClick={duplicatePreviousRecord}
                    className="w-full"
                    variant="secondary"
                  >
                    Duplicar Registro Anterior
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add New Entry */}
          {showProjectsArea && (
            <>
              {/* Duplicate Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={duplicatePreviousRecord}
                  variant="secondary"
                  size="sm"
                >
                  Duplicar Registro Anterior
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Adicionar Projeto ao Dia</CardTitle>
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="entry-hours">Horas</Label>
                  <Input
                    id="entry-hours"
                    type="number"
                    min="0"
                    value={newEntry.hours || ''}
                    onChange={(e) => {
                      const hours = Number(e.target.value);
                      const percentage = convertHoursToPercentage(hours, newEntry.minutes || 0);
                      setNewEntry({ ...newEntry, hours, percentage });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const percentage = convertHoursToPercentage(newEntry.hours || 0, newEntry.minutes || 0);
                        setNewEntry({ ...newEntry, percentage });
                      }
                    }}
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
                    onChange={(e) => {
                      const minutes = Number(e.target.value);
                      const percentage = convertHoursToPercentage(newEntry.hours || 0, minutes);
                      setNewEntry({ ...newEntry, minutes, percentage });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="entry-percentage">%</Label>
                  <Input
                    id="entry-percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newEntry.percentage || ''}
                    onChange={(e) => {
                      const percentage = Number(e.target.value);
                      const { hours, minutes } = convertPercentageToHours(percentage);
                      setNewEntry({ ...newEntry, percentage, hours, minutes });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const { hours, minutes } = convertPercentageToHours(newEntry.percentage || 0);
                        setNewEntry({ ...newEntry, hours, minutes });
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Validation Message */}
              {!validateTotalPercentage() && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  ⚠️ O total de horas ultrapassará 100% do ponto do dia!
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  onClick={addToDraft} 
                  disabled={!newEntry.project}
                  className="flex-1"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar ao Rascunho
                </Button>
                <Button 
                  onClick={addEntry} 
                  disabled={!newEntry.project}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Direto
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Draft Entries */}
          {draftEntries.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Rascunho ({draftEntries.length} itens)</CardTitle>
                  <Button size="sm" onClick={addAllDraftEntries}>
                    Confirmar Todos
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {draftEntries.map((entry, index) => (
                  <div key={entry.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="text-sm">
                      <div className="font-medium">{entry.project}</div>
                      <div className="text-xs text-muted-foreground">
                        {entry.hours}h {(entry.minutes || 0) > 0 && `${entry.minutes}min`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDraftEntry(entry.id!)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          </>
          )}

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
                          {entry.hours}h {entry.minutes > 0 && `${entry.minutes}min`} ({entry.percentage?.toFixed(1)}%)
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