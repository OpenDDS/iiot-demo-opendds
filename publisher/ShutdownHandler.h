#ifndef SHUTDOWNHANDLER_H
#define SHUTDOWNHANDLER_H

#include <orbsvcs/Shutdown_Utilities.h>
#include <ace/Thread_Mutex.h>
#include <ace/Condition_Thread_Mutex.h>
#include <ace/OS_NS_sys_time.h>

class ShutdownHandler : public Shutdown_Functor {
public:
  ShutdownHandler()
    : stop_(false), cond_(lock_) {}

  void operator()(int)
  {
    ACE_GUARD(ACE_Thread_Mutex, g, lock_);
    stop_ = true;
    cond_.signal();
  }

  bool stop() const
  {
    ACE_GUARD_RETURN(ACE_Thread_Mutex, g, lock_, false);
    return stop_;
  }

  void wait(const ACE_Time_Value& timeout)
  {
    const ACE_Time_Value abs = ACE_OS::gettimeofday() + timeout;
    ACE_GUARD(ACE_Thread_Mutex, g, lock_);
    while (!stop_) {
      if (cond_.wait(&abs) == -1 && errno == ETIME) return;
    }
  }

private:
  bool stop_;
  mutable ACE_Thread_Mutex lock_;
  ACE_Condition_Thread_Mutex cond_;
};

#endif
