#include "DemoData.h"
#include "ShutdownHandler.h"
#include "NexmatixTypeSupportImpl.h"
#include <dds/DCPS/Marked_Default_Qos.h>
#include <dds/DCPS/Service_Participant.h>

#include <iostream>
#include <ace/Get_Opt.h>

#ifdef __VXWORKS__
# include <openssl/err.h>
# include <openssl/rand.h>
#endif

#define NO_LISTENER 0, 0

namespace {
  const DDS::DomainId_t DOMAIN_ID = 23;
  const char* TOPIC_NAME = "Valve";
  int sleep_time_in_sec = 1;
  bool bogus_data = false;
  std::string governance_file = "security/governance_signed.p7s";
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
  ACE_Get_Opt get_opts(argc, argv, ACE_TEXT("t:bg:"));

  int c;
  while ((c = get_opts()) != -1) {
    switch (c) {
    case 't':
      sleep_time_in_sec = ACE_OS::atoi(get_opts.opt_arg());
      std::cout << "sleep time = " << sleep_time_in_sec << " sec" << std::endl;
      break;
    case 'b':
      bogus_data = true;
      std::cout << "sending bogus data" << std::endl;
      break;
    case 'g':
      governance_file = ACE_TEXT_ALWAYS_CHAR(get_opts.opt_arg());
      std::cout << "using governance file: " << governance_file << std::endl;
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

std::string cert_dir()
{
  const char* const cert_dir_env = getenv("CERT_DIR");
  if (cert_dir_env) {
    return cert_dir_env;
  }

  const std::string dds_root(getenv("DDS_ROOT"));
  return dds_root + "/tests/security/certs";
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
#ifdef __VXWORKS__
  // For demo purposes only, not cryptographically secure
  unsigned char buf[32];
  static const unsigned long PRNG =
    ERR_PACK(ERR_LIB_RAND, RAND_F_RAND_BYTES, RAND_R_PRNG_NOT_SEEDED);
  while (RAND_bytes(buf, sizeof buf) == 0 && ERR_get_error() == PRNG) {
    RAND_seed(buf, sizeof buf);
  }
#endif
  try {
    const DDS::DomainParticipantFactory_var dpf =
      TheParticipantFactoryWithArgs(argc, argv);

    if (parse_args(argc, argv))
      return 1;

    DDS::DomainParticipantQos qos;
    dpf->get_default_participant_qos(qos);

    if (TheServiceParticipant->get_security()) {
      const std::string dds_certs = cert_dir();
      DDS::PropertySeq& props = qos.property.value;
      append(props, DDSSEC_PROP_IDENTITY_CA,
        dds_certs + "/opendds_identity_ca_cert.pem");
      append(props, DDSSEC_PROP_PERM_CA,
        dds_certs + "/opendds_identity_ca_cert.pem");
      append(props, DDSSEC_PROP_PERM_GOV_DOC, governance_file);
      append(props, DDSSEC_PROP_IDENTITY_CERT,
        dds_certs + "/mock_participant_1/opendds_participant_cert.pem");
      append(props, DDSSEC_PROP_IDENTITY_PRIVKEY,
        dds_certs + "/mock_participant_1/opendds_participant_private_key.pem");
      append(props, DDSSEC_PROP_PERM_DOC, "security/permissions_1_signed.p7s");
    }

    const DDS::DomainParticipant_var participant =
      dpf->create_participant(DOMAIN_ID, qos, NO_LISTENER);

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

    DemoData demo(bogus_data);
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
