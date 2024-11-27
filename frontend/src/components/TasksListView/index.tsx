import { useCallback, useEffect, useState } from "react";
import { BarLoader } from "react-spinners";

import TaskDisplayCard from "../TaskDisplayCard";
import { SC_TaskListContainer } from "./styles";
import {
  BAR_LOADER_HEIGHT,
  BAR_LOADER_WIDTH,
  STYLE_TEXT_COLOR,
} from "../../constants";
import { AddEditButton } from "../AddEditButton";
import {
  getPreviousTasksAPI,
  getTagTasksAPI,
  getTodayTasksAPI,
  getUpcomingTasksAPI,
} from "../../API/tasksAPI";
import {
  isAPIErrorMessage,
  isTagAPIConvertedData,
} from "../../utils/objectTypeCheckers";
import ViewHeader from "../ViewHeader";
import {
  SC_BackgroundContainer,
  SC_CentralNoDataContainer,
  SC_EmptyDisplayHeader,
} from "../commonStyles";
import ErrorMessage from "../ErrorMessage";

type TaskListViewProps = {
  mode: SelectedView;
  tagId?: string;
};

const TasksListView = ({ mode, tagId }: TaskListViewProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tag, setTag] = useState<Tag>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      let data: Task[] | TagAPIConvertedData | APIErrorMessage;
      if (mode === "TODAY") {
        data = await getTodayTasksAPI();
      } else if (mode === "UPCOMING") {
        data = await getUpcomingTasksAPI();
      } else if (mode === "PREVIOUS") {
        data = await getPreviousTasksAPI();
      } else if (mode === "TAG") {
        if (tagId === undefined) throw Error("Tag ID not passed!");
        data = await getTagTasksAPI(tagId);
      } else {
        throw Error("Settings View is used for Task listing component!");
      }
      if (isAPIErrorMessage(data)) {
        setTasks([]);
        setErrorMessage(data.detail);
      } else if (isTagAPIConvertedData(data)) {
        setTasks(data.taskSet);
        setTag({
          name: data.name,
          colorHex: data.colorHex,
          sId: data.sId,
        });
      } else {
        setTasks(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [mode, tagId]);

  useEffect(() => {
    getTasks().catch((e) => console.log(e));
  }, [getTasks]);

  const getEmptyDisplayText = () => {
    switch (mode) {
      case "TODAY":
        return "No tasks to complete today! Enjoy a peaceful day!";
      case "UPCOMING":
        return "You don't have any upcoming tasks! Enjoy a peaceful day!";
      case "PREVIOUS":
        return "You do not have any pending tasks! Enjoy a peaceful day!";
      case "TAG":
        return "There are no tasks in with this tag";
    }
  };

  const getListViewHeading = () => {
    const now = new Date();
    switch (mode) {
      case "TODAY":
        return (
          <ViewHeader
            h1Text="Today"
            h2Text={`(${now.toLocaleDateString(undefined, {
              dateStyle: "full",
            })})`}
            addButtonText="Create a new Task"
          />
        );
      case "UPCOMING":
        return (
          <ViewHeader h1Text="Upcoming" addButtonText="Create a new Task" />
        );
      case "TAG":
        return (
          <ViewHeader
            h1Text={
              tag === undefined ? (
                <BarLoader
                  color={STYLE_TEXT_COLOR}
                  height={BAR_LOADER_HEIGHT}
                  width={BAR_LOADER_WIDTH}
                />
              ) : (
                tag.name
              )
            }
            addButtonText="Create a new Task"
            editButtonText="Edit Tag"
          />
        );
      case "PREVIOUS":
        return (
          <ViewHeader h1Text="Previous" addButtonText="Create a new Task" />
        );
    }
  };

  return (
    <SC_BackgroundContainer>
      {getListViewHeading()}
      {isLoading ? (
        <SC_CentralNoDataContainer>
          <BarLoader
            color={STYLE_TEXT_COLOR}
            height={BAR_LOADER_HEIGHT}
            width={BAR_LOADER_WIDTH}
          />
        </SC_CentralNoDataContainer>
      ) : tasks.length === 0 ? (
        <SC_CentralNoDataContainer>
          {errorMessage !== undefined ? (
            <ErrorMessage errorMessage={errorMessage} />
          ) : (
            <>
              <SC_EmptyDisplayHeader>
                {getEmptyDisplayText()}
              </SC_EmptyDisplayHeader>
              <AddEditButton text="Create a new Task" mode="ADD" />
            </>
          )}
        </SC_CentralNoDataContainer>
      ) : (
        <SC_TaskListContainer>
          {tasks?.map((each) => (
            <TaskDisplayCard key={each.sId} data={each} mode={mode} />
          ))}
        </SC_TaskListContainer>
      )}
    </SC_BackgroundContainer>
  );
};

export default TasksListView;
