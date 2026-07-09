import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Checkbox, Collapse, Divider, FormControlLabel, Grid, IconButton, Paper, Stack, Theme, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { CreateTaskForm } from '../components/CreateTaskForm';
import { Pagination } from '../components/Pagination';
import { TaskList } from '../components/TaskList';
import { UserSelector } from '../components/UserSelector';
import { useTaskTypes } from '../hooks/useTaskTypes';
import { TaskStatusFilter, TASKS_PAGE_SIZE, UserTasksFilterState, useUserTasks } from '../hooks/useUserTasks';
import { useUsers } from '../hooks/useUsers';

const useStyles = makeStyles((theme: Theme) => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: theme.spacing(2),
    marginBottom: theme.spacing(2.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  logo: {
    fontWeight: 700,
    color: theme.palette.primary.main,
  },
  panel: {
    padding: theme.spacing(2.25),
  },
  filterPanel: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2.5),
  },
  tasksHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tasksListContainer: {
    minHeight: 360,
    transition: 'opacity 150ms ease',
  },
  isFetching: {
    opacity: 0.5,
  },
  expandIcon: {
    transform: 'rotate(0deg)',
    transition: theme.transitions.create('transform', { duration: 150 }),
  },
  expandIconOpen: {
    transform: 'rotate(180deg)',
  },
}));

/**
 * GET /users and GET /task-types each run exactly once (useUsers /
 * useTaskTypes) and are passed down as plain props.
 *
 * GET /users/:userId/tasks is fully server-driven: every filter (status,
 * viewBy, task type) and the page number are real query params that hit
 * the database with WHERE + skip/take, so this stays fast for a user
 * with thousands of tasks - nothing is fetched-all-then-filtered client
 * side.
 */
export const HomePage = () => {
  const classes = useStyles();
  const [userId, setUserId] = useState('');
  const [page, setPage] = useState(1);
  const [listOpen, setListOpen] = useState(true);
  const [showOpen, setShowOpen] = useState(true);
  const [showClosed, setShowClosed] = useState(true);
  const [viewBy, setViewBy] = useState<'assigned' | 'created'>('assigned');

  const { taskTypes } = useTaskTypes();
  const users = useUsers();

  // Task-type filter: starts with every known type selected, once the
  // list of types has loaded. Driven entirely by taskTypes (from
  // GET /task-types), so a brand new task type just shows up here too -
  // nothing below is hard-coded to "procurement"/"development".
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typesInitialized, setTypesInitialized] = useState(false);

  useEffect(() => {
    if (!typesInitialized && taskTypes.length > 0) {
      setSelectedTypes(taskTypes.map((t) => t.type));
      setTypesInitialized(true);
    }
  }, [taskTypes, typesInitialized]);

  useEffect(() => {
    if (userId) setListOpen(true);
  }, [userId]);

  const statusFilter: TaskStatusFilter =
    !showOpen && !showClosed ? 'none' : showOpen && showClosed ? 'all' : showOpen ? 'open' : 'closed';

  const allTypesSelected = typesInitialized && selectedTypes.length === taskTypes.length;
  const filters: UserTasksFilterState = {
    status: statusFilter,
    viewBy,
    types: allTypesSelected ? undefined : selectedTypes,
  };

  const { data, isFetching, error, refetch } = useUserTasks(userId, page, filters);



  const handleUserChange = useCallback((id: string) => {
    setUserId(id);
    setPage(1);
    setViewBy('assigned');
  }, []);

  const handleTaskCreated = useCallback(() => {
    setPage(1);
    refetch(); // new task always appears at the top of page 1
  }, [refetch]);

  const toggleList = useCallback(() => setListOpen((v) => !v), []);

  const handleShowOpenChange = useCallback(() => {
    setShowOpen((v) => !v);
    setPage(1);
  }, []);

  const handleShowClosedChange = useCallback(() => {
    setShowClosed((v) => !v);
    setPage(1);
  }, []);

  const handleViewByChange = useCallback(() => {
    setViewBy((v) => (v === 'created' ? 'assigned' : 'created'));
    setPage(1);
  }, []);

  const toggleType = useCallback((type: string) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
    setPage(1);
  }, []);

  const noTypesSelected = typesInitialized && selectedTypes.length === 0;
  const showTasksArea = statusFilter !== 'none' && !noTypesSelected;

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto', px: 2, py: 3 }}>
      <Box className={classes.header}>
        <Typography variant="h6" className={classes.logo}>
          🗂️ Task Management Platform
        </Typography>
      </Box>

      <Paper variant="outlined" className={classes.filterPanel}>
        <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
          Filter by user
        </Typography>
        <UserSelector users={users} value={userId} onChange={handleUserChange} label="User" />
      </Paper>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" className={classes.panel}>
            {userId ? (
              <CreateTaskForm taskTypes={taskTypes} users={users} currentUserId={userId} onCreated={handleTaskCreated} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Select a user above to create a task.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper variant="outlined" className={classes.panel}>
            <Box className={classes.tasksHeader}>
              <Typography variant="subtitle1">My Tasks ({data ? data.total : '…'})</Typography>
              {userId && (
                <IconButton
                  size="small"
                  onClick={toggleList}
                  className={clsx(classes.expandIcon, { [classes.expandIconOpen]: listOpen })}
                  aria-label={listOpen ? 'Collapse tasks' : 'Expand tasks'}
                >
                  <ExpandMoreIcon />
                </IconButton>
              )}
            </Box>

            {userId && (
              <>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <FormControlLabel
                    control={<Checkbox size="small" checked={showOpen} onChange={handleShowOpenChange} />}
                    label="Open"
                  />
                  <FormControlLabel
                    control={<Checkbox size="small" checked={showClosed} onChange={handleShowClosedChange} />}
                    label="Closed"
                  />
                  <FormControlLabel
                    control={<Checkbox size="small" checked={viewBy === 'created'} onChange={handleViewByChange} />}
                    label="Opened by me"
                  />
                </Stack>

                {taskTypes.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                    {taskTypes.map((t) => (
                      <FormControlLabel
                        key={t.type}
                        control={
                          <Checkbox
                            size="small"
                            checked={selectedTypes.includes(t.type)}
                            onChange={() => toggleType(t.type)}
                          />
                        }
                        label={t.type}
                      />
                    ))}
                  </Stack>
                )}

                <Divider sx={{ mb: 1 }} />
              </>
            )}

            {!userId && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Select a user to view their tasks.
              </Typography>
            )}

            {userId && statusFilter === 'none' && (
              <Typography variant="body2" color="text.secondary">
                Select at least one filter (Open or Closed) to see tasks.
              </Typography>
            )}

            {userId && statusFilter !== 'none' && noTypesSelected && (
              <Typography variant="body2" color="text.secondary">
                Select at least one task type to see tasks.
              </Typography>
            )}

            {userId && showTasksArea && (
              <Collapse in={listOpen} unmountOnExit>
                <Box className={clsx(classes.tasksListContainer, { [classes.isFetching]: isFetching })} sx={{ mt: 1 }}>
                  {error && (
                    <Typography variant="body2" color="error">
                      {error}
                    </Typography>
                  )}
                  {!error && data && (
                    <TaskList tasks={data.tasks} taskTypes={taskTypes} users={users} onChanged={refetch} />
                  )}
                  {!error && !data && (
                    <Typography variant="body2" color="text.secondary">
                      Loading tasks...
                    </Typography>
                  )}
                </Box>

                {data && (
                  <Pagination
                    page={page}
                    pageSize={TASKS_PAGE_SIZE}
                    total={data.total}
                    onPageChange={setPage}
                    disabled={isFetching}
                  />
                )}
              </Collapse>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
