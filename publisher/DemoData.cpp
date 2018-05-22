#include "DemoData.h"
#include "NexmatixTypeSupportC.h"
#include <cstring>
#include <cassert>
#include <iostream>


		// The manifold ids are 1, 2, 3, 4, and 5.
		// The one they focus on is in the lower left corner and is id 5.
		// The valve ids go from 0 to 5 on each manifold.

const int max_manifold_id = 5;
const int valve_count = 6;

int serial_number(int valve_id, int manifold_id)
{
  return valve_id * 1000000 + 10010 + manifold_id;
}

std::string part_number(int valve_id, int manifold_id)
{
  char buf[64];
  std::snprintf(buf, 64, "%d%dNX-DCV-SM-BLU-1-1-VO-L1-SO-OO", valve_id, manifold_id);
  return buf;
}

int lifecycle_count(int valve_id, int manifold_id)
{
  int base = 1;
  for (int i = 0; i < manifold_id/2; ++i) base*=10;
  return base + valve_id;
}

const int pfArray[] =  {0,1,1,1 ,1,1,1,0 ,0,0,2,2 ,2,2,2,0};

const int spArray[] = {100,90,80,70 ,60,65,70,75 ,80,80,80,80 ,80,80,85,95};
const int ppArray[] = { 90,80,70,60 ,50,30,25,25 ,35,40,50,70 ,70,70,70,85};
const bool lfArray[] = {0, 0, 0, 1 , 1, 1, 1, 1 , 1, 1, 1, 0 , 0, 0, 0, 0};
const bool vfArray[] = {0, 1, 1, 1 , 1, 1, 1, 1 , 1, 1, 0, 0 , 0, 0, 0, 0};

DemoData::DemoData(bool bogus)
  : tick_(0)
  , bogus_(bogus)
{
}

void DemoData::write(const DDS::DataWriter_var& vd_dw)
{
  static int iteration = 0;

  const Nexmatix::ValveDataDataWriter_var dw =
    Nexmatix::ValveDataDataWriter::_narrow(vd_dw);

  int num_data = 0;

  for (int manifold_id = 1; manifold_id <= max_manifold_id; ++manifold_id) {
    for (int valve_id=0; valve_id < valve_count; ++valve_id) {
      Nexmatix::ValveData data;
      data.manifoldId = manifold_id;
      data.stationId = valve_id;
      data.valveSerialId = serial_number(valve_id, manifold_id);
      data.partNumber = part_number(valve_id, manifold_id).c_str();


      data.cycles = lifecycle_count(valve_id, manifold_id) + ++tick_;

      int index = data.cycles & 0x0F;

      // fault detect
      bool can_fault = (manifold_id == 5);
      if (can_fault) {
        data.leakFault = lfArray[index];
        data.pressureFault = static_cast<Nexmatix::PresureFault>(pfArray[index]);
        data.valveFault = vfArray[index];
      }
      else {
        data.leakFault = false;
        data.valveFault = false;
        data.pressureFault = Nexmatix::NO_FAULT;
      }

      // data
      data.pressure = (bogus_ ? 100 : 1) * ppArray[index];
      data.suppliedPressure = (bogus_ ? 100 : 1) * spArray[index];

      dw->write(data, DDS::HANDLE_NIL);
      num_data += 1;
    }
  }
  std::cout << "Iteration " << iteration++ << " Published " << num_data << " samples\n";
}
