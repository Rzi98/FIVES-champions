/*
SCRIPT FOR COMPASS ORIENTATION UPDATE
- compass() - returns the current orientation of the robot
- getCurrOrientation() - continuously updates the current orientation of the robot

*/

#ifndef COMPASS_H
#define COMPASS_H

int compass()
{
	int num;
	num = SensorValue[compass_LSB] * pow(2, 3) + SensorValue[compass_Bit2] * pow(2, 2) + SensorValue[compass_Bit3] * 2 + SensorValue[compass_MSB];
	switch (num)
	{
		case 0b0111:  
			return 0; // N (away from base)
			break;
		case 0b0110: 
			return 45;//NW
			break;
		case 0b1110:
			return 90; //W
			break;
		case 0b1100:
			return 135; //SW
			break;
		case 0b1101: 
			return 180; //S   
			break;
		case 0b1001:
			return 225; //SE
			break;
		case 0b1011:
			return 270; //E
			break;
		case 0b0011:
			return 315; //NE
			break;
	}
	return -1;
}


task getCurrOrientation()
{
	while (1) {
		CURR_ORIENTATION = compass();
	}
}

#endif