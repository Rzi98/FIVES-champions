/*
SCRIPT FOR DEBUGGING PURPOSES
- debugSharpSensors() - prints out the values of the sharp sensors
- debugLimitSwitches() - prints out the values of the limit switches
- debugOrientation() - prints out the current orientation of the robot
- debugState() - prints out the current state of the robot
- debugAll() - prints out all of the above
- motorTestRun(char motor_type) - runs a motor test for the drive or roller motors
- task task1() - prints out "Task 1" every 2 seconds
- task task2() - prints out "Task 2" every loop


Created by: Raizee, 2024
*/

#ifndef DEBUGGER_H
#define DEBUGGER_H


void debugSharpSensors() {
	writeDebugStreamLine("LEFT BALL SENSOR: %f\n", sharpsensor.leftBallSensor);
	writeDebugStreamLine("RIGHT BALL SENSOR: %f\n\n", sharpsensor.rightBallSensor);
	writeDebugStreamLine("FRONT OPP SENSOR: %f\n", sharpsensor.frontOppSensor);
	writeDebugStreamLine("BACK OPP SENSOR: %f\n\n", sharpsensor.backOppSensor);
}

void debugLimitSwitches() {
    writeDebugStreamLine("MAIN LIMIT: %d\n", limit_switches.limit_main_ON);
    writeDebugStreamLine("COLLECTOR LIMIT: %d\n", limit_switches.limit_collector_depressed);
    writeDebugStreamLine("BACK LEFT LIMIT: %d\n", limit_switches.limit_backL_depressed);
    writeDebugStreamLine("BACK RIGHT LIMIT: %d\n\n", limit_switches.limit_backR_depressed);
}

void debugOrientation() {
	writeDebugStreamLine("ORIENTATION: %d\n\n", CURR_ORIENTATION);
}

void debugState() {
	writeDebugStreamLine("STATE: %d\n\n", CURRENT_STATE);
}

void debugAll() {
	debugSharpSensors();
    debugLimitSwitches();
	debugOrientation();
	debugState();
}

void motorTestRun(char motor_type) {
	if (motor_type == 'd') {
		writeDebugStreamLine("Drive motor test run\n");
		while (1) {
			drive("forward", 1);
		}
	}
	else if (motor_type == 'r') {
		writeDebugStreamLine("Roller motor test run\n");
		while (1) {
			spinRoller();
		}
	}

	else if (motor_type == 'a') {
		writeDebugStreamLine("Gate motor test run\n");
		while (1) {
			drive("forward", 1);
			spinRoller();
		}
	}
}

void motorTestRunWls(char motor_type) {
	if (motor_type == 'd') {
		writeDebugStreamLine("Drive motor test run\n");
		while (1) {
			drive("forward", 1);
		}
	}
	else if (motor_type == 'r') {
		writeDebugStreamLine("Roller motor test run\n");
		while (1) {
			checkLimitSwitches(&limit_switches, 'c');
			if (limit_switches.limit_collector_depressed) {
				motor[roller_motor] = 0;
				break;
			}
			spinRoller();
		}
	}

	else if (motor_type == 'a') {
		writeDebugStreamLine("Gate motor test run\n");
		while (1) {
			drive("forward", 1);
			spinRoller();
		}
	}
}

void gateTestRun()
{
	int start = nSysTime;
	while (nSysTime - start < 250) {
		motor[gate_motor] = 50;
	}
	motor[gate_motor] = 0;
	delay(2000);

	start = nSysTime;
	while (nSysTime - start < 150) {
		motor[gate_motor] = -50;
	}
	motor[gate_motor] = 0;
}


void gateTestWlsRun()
{
	while (1) {
		checkLimitSwitches(&limit_switches, 'b');
		writeDebugStreamLine("Back Left: %d\n", limit_switches.limit_backL_depressed);
		writeDebugStreamLine("Back Right: %d\n", limit_switches.limit_backR_depressed);\
		delay(1000);
		if (limit_switches.limit_backL_depressed && limit_switches.limit_backR_depressed) {
			gateTestRun();
			break;
		}
	}
}

void debugLineSensor(){
	writeDebugStreamLine("LEFT BACK LINE: %d\n", SensorValue[leftBackLine]);
	writeDebugStreamLine("LEFT BACK LINE: %d\n", SensorValue[leftFrontLine]);
	writeDebugStreamLine("LEFT BACK LINE: %d\n", SensorValue[rightFrontLine]);
	writeDebugStreamLine("LEFT BACK LINE: %d\n", SensorValue[leftBackLine]);
}

#endif