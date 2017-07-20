#include "DemoData.h"
#include "ShutdownHandler.h"
#include "NexmatixTypeSupportImpl.h"
#include <dds/DCPS/Marked_Default_Qos.h>
#include <dds/DCPS/Service_Participant.h>

#include <iostream>

#define NO_LISTENER 0, 0

namespace {
  const DDS::DomainId_t DOMAIN_ID = 23;
  const char* TOPIC_NAME = "Valve";
}

int main(int argc, char* argv[])
{
  try {
    const DDS::DomainParticipantFactory_var dpf =
      TheParticipantFactoryWithArgs(argc, argv);

    const DDS::DomainParticipant_var participant =
      dpf->create_participant(DOMAIN_ID, PARTICIPANT_QOS_DEFAULT, NO_LISTENER);

    const Nexmatix::ValveDataTypeSupport_var vd_ts =
      new Nexmatix::ValveDataTypeSupportImpl;
    vd_ts->register_type(participant, "");
    const CORBA::String_var vd_type = vd_ts->get_type_name();
    const DDS::Topic_var vd_topic =
      participant->create_topic(TOPIC_NAME, vd_type, TOPIC_QOS_DEFAULT,
                                NO_LISTENER);

    const DDS::Publisher_var pub =
      participant->create_publisher(PUBLISHER_QOS_DEFAULT, NO_LISTENER);

    DDS::DataWriterQos vd_qos;
    pub->get_default_datawriter_qos(vd_qos);
    vd_qos.durability.kind = DDS::TRANSIENT_LOCAL_DURABILITY_QOS;
    const DDS::DataWriter_var vd_dw =
      pub->create_datawriter(vd_topic, vd_qos, NO_LISTENER);

    DemoData demo;
    ShutdownHandler sh;
    Service_Shutdown shutdown(sh);
    std::cerr << "Starting to write valve data.\n";

    while (!sh.stop()) {
      demo.write(vd_dw);
      sh.wait(ACE_Time_Value(1,0));
    }

    participant->delete_contained_entities();
    dpf->delete_participant(participant);
    TheServiceParticipant->shutdown();

  } catch (const CORBA::Exception& e) {
    e._tao_print_exception("Exception from main():");
    return 1;

  } catch (const std::exception& e) {
    std::cerr << "std::exception from main(): " << e.what() << '\n';
    return 1;

  } catch (...) {
    std::cerr << "unknown exception from main()\n";
    return 1;
  }

  return 0;
}
