#include "DemoData.h"
#include "ShutdownHandler.h"
#include "NexmatixTypeSupportImpl.h"
#include <dds/DCPS/Marked_Default_Qos.h>
#include <dds/DCPS/Service_Participant.h>

#include <iostream>
#include <ace/Get_Opt.h>

#define NO_LISTENER 0, 0

namespace {
  const DDS::DomainId_t DOMAIN_ID = 23;
  const char* TOPIC_NAME = "Valve";
  int sleep_time_in_sec = 1;
}

const char DDSSEC_PROP_IDENTITY_CA[] = "dds.sec.auth.identity_ca";
const char DDSSEC_PROP_IDENTITY_CERT[] = "dds.sec.auth.identity_certificate";
const char DDSSEC_PROP_IDENTITY_PRIVKEY[] = "dds.sec.auth.private_key";
const char DDSSEC_PROP_PERM_CA[] = "dds.sec.access.permissions_ca";
const char DDSSEC_PROP_PERM_GOV_DOC[] = "dds.sec.access.governance";
const char DDSSEC_PROP_PERM_DOC[] = "dds.sec.access.permissions";

int
parse_args(int argc, ACE_TCHAR *argv[])
{
  //
  // Command-line Options:
  //
  //    -w <number of topics>
  //    -s <samples per topic>
  //    -z <sec>  -- don't check the sample counts, just sleep this much
  //                 and exit
  //

  ACE_Get_Opt get_opts(argc, argv, ACE_TEXT("t:"));

  int c;
  while ((c = get_opts()) != -1) {
    switch (c) {
    case 't':
      sleep_time_in_sec = ACE_OS::atoi(get_opts.opt_arg());
      std::cout << "sleep time = " << sleep_time_in_sec << " sec" << std::endl;
      break;
    case '?':
    default:
      ACE_ERROR_RETURN((LM_ERROR,
                        ACE_TEXT("usage: %C -t sleep_time_in_secs\n"), argv[0]),
                       -1);
    }
  }

  return 0;
}

void append(DDS::PropertySeq& props, const char* name, const std::string& value)
{
  const DDS::Property_t prop = {
    name, (std::string("file:") + value).c_str(), false /*propagate*/};
  const unsigned int len = props.length();
  props.length(len + 1);
  props[len] = prop;
}

int main(int argc, char* argv[])
{
  try {
    const DDS::DomainParticipantFactory_var dpf =
      TheParticipantFactoryWithArgs(argc, argv);

    DDS::DomainParticipantQos qos;
    dpf->get_default_participant_qos(qos);

    // Enable Security
    const std::string dds_root(getenv("DDS_ROOT"));
    const std::string dds_certs(dds_root + "/tests/security/certs");
    if (TheServiceParticipant->get_security()) {
      DDS::PropertySeq& props = qos.property.value;
      append(props, DDSSEC_PROP_IDENTITY_CA,
        dds_certs + "/opendds_identity_ca_cert.pem");
      append(props, DDSSEC_PROP_PERM_CA,
        dds_certs + "/opendds_identity_ca_cert.pem");
      append(props, DDSSEC_PROP_PERM_GOV_DOC,
				"security/governance_signed.p7s");
      append(props, DDSSEC_PROP_IDENTITY_CERT,
        dds_certs + "/mock_participant_1/opendds_participant_cert.pem");
      append(props, DDSSEC_PROP_IDENTITY_PRIVKEY,
        dds_certs + "/mock_participant_1/opendds_participant_private_key.pem");
      append(props, DDSSEC_PROP_PERM_DOC,
				"security/permissions_1_signed.p7s");
    }

    const DDS::DomainParticipant_var participant =
      dpf->create_participant(DOMAIN_ID, qos, NO_LISTENER);

    if (parse_args(argc, argv))
      return 1;

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
      sh.wait(ACE_Time_Value(sleep_time_in_sec,0));
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
