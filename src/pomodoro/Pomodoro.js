import React, { useState } from "react";
import classNames from "../utils/class-names";
import { minutesToDuration, secondsToDuration } from "../utils/duration";
import useInterval from "../utils/useInterval";

// These functions are defined outside of the component to insure they do not have access to state
// and are, therefore more likely to be pure.

/**
 * Update the session state with new state after each tick of the interval.
 * @param prevState
 *  the previous session state
 * @returns
 *  new session state with timing information updated.
 */
function nextTick(prevState) {
  const timeRemaining = Math.max(0, prevState.timeRemaining - 1);
  return {
    ...prevState,
    timeRemaining,
  };
}

/**
 * Higher order function that returns a function to update the session state with the next session type upon timeout.
 * @param focusDuration
 *    the current focus duration
 * @param breakDuration
 *    the current break duration
 * @returns
 *  function to update the session state.
 */
function nextSession(focusDuration, breakDuration) {
  /**
   * State function to transition the current session type to the next session. e.g. On Break -> Focusing or Focusing -> On Break
   */
  return (currentSession) => {
    if (currentSession.label === "Focusing") {
      return {
        label: "On Break",
        timeRemaining: breakDuration * 60,
      };
    }
    return {
      label: "Focusing",
      timeRemaining: focusDuration * 60,
    };
  };
}

//Defining 3 components

function FocusDuration({
  focusDuration,
  focusDecrease,
  focusIncrease,
  disableFocusAndBreak,
}) {
  return (
    <div className="input-group input-group-lg mb-2">
      <span className="input-group-text" data-testid="duration-focus">
        {/* TODO: Update this text to display the current focus session duration */}
        Focus Duration: {minutesToDuration(focusDuration)}
      </span>
      <div className="input-group-append">
        {/* TODO: Implement decreasing focus duration and disable during a focus or break session */}
        <button
          type="button"
          className="btn btn-secondary"
          data-testid="decrease-focus"
          onClick={focusDecrease}
          disabled={disableFocusAndBreak}
        >
          <span className="oi oi-minus" />
        </button>
        {/* TODO: Implement increasing focus duration  and disable during a focus or break session */}
        <button
          type="button"
          className="btn btn-secondary"
          data-testid="increase-focus"
          onClick={focusIncrease}
          disabled={disableFocusAndBreak}
        >
          <span className="oi oi-plus" />
        </button>
      </div>
    </div>
  );
}

function BreakDuration({
  breakDuration,
  breakIncrease,
  breakDecrease,
  disableFocusAndBreak,
}) {
  return (
    <div className="input-group input-group-lg mb-2">
      <span className="input-group-text" data-testid="duration-break">
        {/* TODO: Update this text to display the current break session duration */}
        Break Duration: {minutesToDuration(breakDuration)}
      </span>
      <div className="input-group-append">
        {/* TODO: Implement decreasing break duration and disable during a focus or break session*/}
        <button
          type="button"
          className="btn btn-secondary"
          data-testid="decrease-break"
          onClick={breakDecrease}
          disabled={disableFocusAndBreak}
        >
          <span className="oi oi-minus" />
        </button>
        {/* TODO: Implement increasing break duration and disable during a focus or break session*/}
        <button
          type="button"
          className="btn btn-secondary"
          data-testid="increase-break"
          onClick={breakIncrease}
          disabled={disableFocusAndBreak}
        >
          <span className="oi oi-plus" />
        </button>
      </div>
    </div>
  );
}

function ProgressBar({ session, focusDuration, breakDuration }) {
  const timeSeconds =
    (session?.label === "Focusing" ? focusDuration : breakDuration) * 60;
  const timeDiff = timeSeconds - session?.timeRemaining;
  const progressVal = timeDiff !== 0 ? (timeDiff / timeSeconds) * 100 : 0;
  return (
    <div className="progress" style={{ height: "20px" }}>
      <div
        className="progress-bar"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progressVal} // TODO: Increase aria-valuenow as elapsed time increases
        style={{ width: progressVal + "%" }} // TODO: Increase width % as elapsed time increases
      />
    </div>
  );
}

function Pomodoro() {
  // Timer starts out paused
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  // The current session - null where there is no session running
  const [session, setSession] = useState(null);

  // ToDo: Allow the user to adjust the focus and break duration.
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const focusIncrease = () => {
    setFocusDuration((focusDuration) => Math.min(60, focusDuration + 5));
  };
  const focusDecrease = () => {
    setFocusDuration((focusDuration) => Math.max(5, focusDuration - 5));
  };
  const breakIncrease = () => {
    setBreakDuration((breakDuration) => Math.min(15, breakDuration + 1));
  };
  const breakDecrease = () => {
    setBreakDuration((breakDuration) => Math.max(1, breakDuration - 1));
  };
  const [disableFocusAndBreak, setDisableFocusAndBreak] = useState(false);
  const [disableStop, setDisableStop] = useState(true);
  const initialState = () => {
    setFocusDuration(25);
    setBreakDuration(5);
    setDisableStop(true);
    setDisableFocusAndBreak(false);
    setIsTimerRunning(false);
    setSession(null);
  };

  /**
   * Custom hook that invokes the callback function every second
   *
   * NOTE: You will not need to make changes to the callback function
   */
  useInterval(
    () => {
      if (session.timeRemaining === 0) {
        new Audio("https://bigsoundbank.com/UPLOAD/mp3/1482.mp3").play();
        return setSession(nextSession(focusDuration, breakDuration));
      }
      return setSession(nextTick);
    },
    isTimerRunning ? 1000 : null
  );

  /**
   * Called whenever the play/pause button is clicked.
   */
  function playPause() {
    setDisableFocusAndBreak(true);
    setDisableStop(false);
    setIsTimerRunning((prevState) => {
      const nextState = !prevState;
      if (nextState) {
        setSession((prevStateSession) => {
          // If the timer is starting and the previous session is null,
          // start a focusing session.
          if (prevStateSession === null) {
            return {
              label: "Focusing",
              timeRemaining: focusDuration * 60,
            };
          }
          return prevStateSession;
        });
      }
      return nextState;
    });
  }

  return (
    <div className="pomodoro">
      <div className="row">
        <div className="col">
          <FocusDuration
            focusDuration={focusDuration}
            focusIncrease={focusIncrease}
            focusDecrease={focusDecrease}
            disableFocusAndBreak={disableFocusAndBreak}
          />
        </div>
        <div className="col">
          <div className="float-right">
            <BreakDuration
              breakDuration={breakDuration}
              breakIncrease={breakIncrease}
              breakDecrease={breakDecrease}
              disableFocusAndBreak={disableFocusAndBreak}
            />
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <div
            className="btn-group btn-group-lg mb-2"
            role="group"
            aria-label="Timer controls"
          >
            <button
              type="button"
              className="btn btn-primary"
              data-testid="play-pause"
              title="Start or pause timer"
              onClick={playPause}
            >
              <span
                className={classNames({
                  oi: true,
                  "oi-media-play": !isTimerRunning,
                  "oi-media-pause": isTimerRunning,
                })}
              />
            </button>
            {/* TODO: Implement stopping the current focus or break session. and disable the stop button when there is no active session */}
            {/* TODO: Disable the stop button when there is no active session */}
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="stop"
              title="Stop the session"
              disabled={disableStop}
              onClick={initialState}
            >
              <span className="oi oi-media-stop" />
            </button>
          </div>
        </div>
      </div>
      {session ? (
        <div>
          {/* TODO: This area should show only when there is an active focus or break - i.e. the session is running or is paused */}
          <div className="row mb-2">
            <div className="col">
              {/* TODO: Update message below to include current session (Focusing or On Break) total duration */}
              <h2 data-testid="session-title">
                {session?.label} for{" "}
                {session?.label === "Focusing"
                  ? minutesToDuration(focusDuration)
                  : minutesToDuration(breakDuration)}{" "}
                minutes
              </h2>
              {/* TODO: Update message below correctly format the time remaining in the current session */}
              <p className="lead" data-testid="session-sub-title">
                {secondsToDuration(session?.timeRemaining)} remaining
              </p>
              {isTimerRunning === false && <p className="lead font-weight-bold">Paused</p>}
            </div>
          </div>
          <div className="row mb-2">
            <div className="col">
              <ProgressBar
                session={session}
                focusDuration={focusDuration}
                breakDuration={breakDuration}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Pomodoro;
