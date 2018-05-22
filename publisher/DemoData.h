#ifndef DEMODATA_H
#define DEMODATA_H

#include "NexmatixC.h"

#include <vector>

namespace DDS {
  class DataWriter;
  typedef class TAO_Objref_Var_T<DDS::DataWriter> DataWriter_var;
}

class DemoData {
public:
  explicit DemoData(bool bogus);
  void write(const DDS::DataWriter_var& dw);

private:
  int tick_;
  bool bogus_;
};

#endif
